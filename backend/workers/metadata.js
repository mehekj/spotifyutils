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
		{ sort: { updatedAt: 1 }, new: true },
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
				albumName: trackData.album.name,
				albumURI: trackData.album.id,
				artistNames: artistNames,
				artistURIs: artistURIs,
				durationMs: trackData.duration_ms,
				explicit: trackData.explicit,
			},
		},
	);

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
			metadataStatus: "processing",
			lockedAt: {
				$lt: new Date(now - RECOVERY_INTERVAL_MS),
			},
		},
		{
			$set: {
				metadataStatus: "pending",
				lockedAt: null,
			},
		},
	);

	lastRecoveryTime = now;
	logDebug("metadata", "Recovered locked tracks", {
		modified: result.modifiedCount,
		lastRecoveryTime: new Date(lastRecoveryTime).toISOString(),
	});
}

async function waitForRetry(retryAfter) {
	await setTimeout(() => {
		runningRequests--;
	}, retryAfter);
}

while (true) {
	recoverLockedTracks();

	try {
		if (runningRequests < MAX_CONCURRENT_REQUESTS) {
			runningRequests++;
			await processSingleTrack();
			runningRequests--;
		}
	} catch (error) {
		if (error.status === 429) {
			const retryAfter = error.details?.retryAfter * 1000 || DEFAULT_RETRY_DELAY_MS;
			logDebug("metadata", "Rate limit exceeded, retrying after delay", {
				retryAfter,
				retryAt: new Date(Date.now() + retryAfter).toISOString(),
				error: error.message,
			});
			await waitForRetry(retryAfter);
		} else {
			logError("metadata", "Error processing track metadata", error.details?.error || error);
			await waitForRetry(DEFAULT_RETRY_DELAY_MS);
		}
	}

	if (runningRequests >= MAX_CONCURRENT_REQUESTS) {
		await setTimeout(() => {}, 200);
	}
}
