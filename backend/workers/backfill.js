import { tracks, streams } from "../db/conn.js";
import { logDebug, logError } from "../utils/logger.js";

const MAX_CONCURRENT_REQUESTS = 10;
const MAX_REQUEST_RETRIES = 3;
let runningRequests = 0;

const RECOVERY_INTERVAL_MS = 5 * 60 * 1000;
let lastRecoveryTime = null;

async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processSingleTrack() {
	const track = await tracks.findOneAndUpdate(
		{ "backfillJob.status": "pending" },
		{
			$set: {
				"backfillJob.status": "processing",
				"backfillJob.lockedAt": new Date(),
				"backfillJob.attempts": { $inc: 1 },
			},
		},
		{ sort: { "backfillJob.updatedAt": 1 }, new: true },
	);

	if (!track) {
		logDebug("backfill", "No pending tracks found for processing");
		await sleep(360000);
		return;
	}

	const result = await streams.updateMany(
		{
			spotifyTrackURI: track._id,
			metadataComplete: false,
		},
		{
			$set: {
				metadataComplete: true,
				name: track.name,
				albumName: track.albumName,
				albumURI: track.albumURI,
				artistNames: track.artistNames,
				artistURIs: track.artistURIs,
				durationMs: track.durationMs,
				explicit: track.explicit,
			},
		},
	);

	await tracks.updateOne(
		{ _id: track._id },
		{
			$set: {
				"backfillJob.status": "completed",
				"backfillJob.lockedAt": null,
				"backfillJob.updatedAt": new Date(),
			},
		},
	);

	// logDebug("backfill", "Processed track and updated streams", {
	// 	trackId: track._id,
	// 	trackName: track.name,
	// 	artistNames: track.artistNames.join(", "),
	// 	modifiedCount: result.modifiedCount,
	// });
}

async function recoverLockedTracks() {
	const now = Date.now();
	if (lastRecoveryTime && now - lastRecoveryTime < RECOVERY_INTERVAL_MS) {
		return;
	}

	const result = await tracks.updateMany(
		{
			"backfillJob.status": "processing",
			"backfillJob.lockedAt": {
				$lt: new Date(now - RECOVERY_INTERVAL_MS),
			},
		},
		{
			$set: {
				"backfillJob.status": "pending",
				"backfillJob.lockedAt": null,
			},
		},
	);

	lastRecoveryTime = now;
	logDebug("backfill", "Recovered locked tracks", {
		modified: result.modifiedCount,
		lastRecoveryTime: new Date(lastRecoveryTime).toISOString(),
	});
}

async function processSingleTrackWorker() {
	try {
		await processSingleTrack();
	} catch (error) {
		logError("backfill", "Error processing track backfill", error.details?.error || error);
		await sleep(DEFAULT_RETRY_DELAY_MS);
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
