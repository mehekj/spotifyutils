import { artists, albums, tracks } from "../db/conn.js";
import { setTimeout } from "node:timers/promises";
import { spotifyGet } from "../utils/spotify.js";

const MAX_CONCURRENT_REQUESTS = 3;
const runningRequests = 0;

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
}

while (true) {
	try {
		if (runningRequests < MAX_CONCURRENT_REQUESTS) {
			runningRequests++;
			processSingleTrack().then(() => {
				runningRequests--;
			});
		}
	} catch (error) {
		console.error("Error processing track:", error);
		runningRequests--;
	}

	if (runningRequests >= MAX_CONCURRENT_REQUESTS) {
		await setTimeout(100);
	}
}
