import { tracks } from "../db/conn.js";
import { getClientCredentialsAccessToken } from "../utils/auth.js";
import { logDebug, logError } from "../utils/logger.js";
import { spotifyGet } from "../utils/spotify.js";

const MAX_CONCURRENT_REQUESTS = 5;
const MAX_REQUEST_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 5 * 60 * 1000;
let runningRequests = 0;

let spotifyAccessToken = null;
let spotifyTokenExpiresAt = 0;

const RECOVERY_INTERVAL_MS = 5 * 60 * 1000;
let lastRecoveryTime = null;

let pausedUntil = 0;

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const getCachedSpotifyAccessToken = async () => {
	if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt) {
		return spotifyAccessToken;
	}

	const tokenResponse = await getClientCredentialsAccessToken();
	if (!tokenResponse?.accessToken) {
		throw new Error("Failed to fetch Spotify client credentials token");
	}

	spotifyAccessToken = tokenResponse.accessToken;
	spotifyTokenExpiresAt = Date.now() + Math.max(tokenResponse.expiresIn - 60, 0) * 1000;
	return spotifyAccessToken;
};

async function processSingleTrack() {
	const track = await tracks.findOneAndUpdate(
		{ "metadataJob.status": "pending" },
		{
			$set: {
				"metadataJob.status": "processing",
				"metadataJob.lockedAt": new Date(),
				"metadataJob.attempts": { $inc: 1 },
			},
		},
		{ sort: { "metadataJob.updatedAt": 1 }, new: true },
	);

	if (!track) {
		logDebug("metadata", "No pending tracks found for processing");
		return;
	}

	const accessToken = await getCachedSpotifyAccessToken();
	const trackData = await spotifyGet(null, null, `/tracks/${track._id}`, {}, accessToken);

	if (!trackData) {
		logError("metadata", "Failed to fetch Spotify data for track", { trackId: track._id });
		const newStatus = track.metadataJob.attempts >= MAX_REQUEST_RETRIES ? "failed" : "pending";
		await tracks.updateOne(
			{ _id: track._id },
			{
				$set: {
					"metadataJob.status": newStatus,
					"metadataJob.lockedAt": null,
					"metadataJob.updatedAt": new Date(),
				},
			},
		);
		return;
	}

	const artistURIs = trackData.artists.map((artist) => artist.id);
	const artistNames = trackData.artists.map((artist) => artist.name);

	const finalTrack = await tracks.updateOne(
		{ _id: track._id },
		{
			$set: {
				"metadataJob.status": "completed",
				"metadataJob.lockedAt": null,
				"backfillJob.status": "pending",
				name: trackData.name,
				albumName: trackData.album.name,
				albumURI: trackData.album.id,
				artistNames: artistNames,
				artistURIs: artistURIs,
				durationMs: trackData.duration_ms,
				explicit: trackData.explicit,
			},
		},
	);

	// TODO album entries and artist stubs

	// logDebug("metadata", "Successfully processed track metadata", {
	// 	trackId: track._id,
	// 	trackName: trackData.name,
	// 	artistNames: artistNames.join(", "),
	// });
}

async function recoverLockedTracks() {
	const now = Date.now();
	if (lastRecoveryTime && now - lastRecoveryTime < RECOVERY_INTERVAL_MS) {
		return;
	}

	const result = await tracks.updateMany(
		{
			"metadataJob.status": "processing",
			"metadataJob.lockedAt": {
				$lt: new Date(now - RECOVERY_INTERVAL_MS),
			},
		},
		{
			$set: {
				"metadataJob.status": "pending",
				"metadataJob.lockedAt": null,
			},
		},
	);

	lastRecoveryTime = now;
	logDebug("metadata", "Recovered locked tracks", {
		modified: result.modifiedCount,
		lastRecoveryTime: new Date(lastRecoveryTime).toISOString(),
	});
}

async function processSingleTrackWorker() {
	try {
		await processSingleTrack();
	} catch (error) {
		if (error.status === 429) {
			const retryAfter = error.details?.retryAfter * 1000 || DEFAULT_RETRY_DELAY_MS;
			pausedUntil = Date.now() + retryAfter;
			// logDebug("metadata", "Rate limit exceeded; pausing all workers", {
			// 	retryAfter,
			// 	retryAt: new Date(pausedUntil).toISOString(),
			// 	error: error.message,
			// });
			await sleep(retryAfter);
		} else {
			logError("metadata", "Error processing track metadata", error.details?.error || error);
			await sleep(DEFAULT_RETRY_DELAY_MS);
		}
	} finally {
		runningRequests--;
	}
}

while (true) {
	await recoverLockedTracks();

	while (runningRequests < MAX_CONCURRENT_REQUESTS) {
		runningRequests++;
		processSingleTrackWorker();
	}

	await sleep(200);
}
