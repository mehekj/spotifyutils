import { logDebug, logError } from "../utils/logger.js";
import { MongoAPIError } from "../utils/mongo.js";
import { getSpotifyItemId } from "../utils/spotify.js";
import { tracks } from "./conn.js";
import { getAlbumInfo } from "./albums.js";

export const insertTrackStubs = async (data) => {
	try {
		const uniqueTracks = new Set(
			data.map((entry) => getSpotifyItemId(entry.spotifyTrackURI)).filter(Boolean),
		);

		if (uniqueTracks.length === 0) {
			return;
		}

		const result = await tracks.bulkWrite(
			Array.from(uniqueTracks).map((trackUri) => ({
				updateOne: {
					filter: { _id: trackUri },
					update: {
						$setOnInsert: {
							_id: trackUri,

							name: null,

							artistURIs: [],
							artistNames: [],

							albumURI: null,
							albumName: null,

							durationMs: null,
							explicit: null,

							metadataJob: {
								status: "pending",
								attempts: 0,
								lockedAt: null,
								updatedAt: new Date(),
							},

							"backfillJob.attempts": 0,
							"backfillJob.lockedAt": null,
							"backfillJob.updatedAt": new Date(),
						},
						$set: {
							"backfillJob.status": "pending",
						},
					},
					upsert: true,
				},
			})),
		);

		logDebug("mongo", "track stub operations complete", {
			inserted: result.upsertedCount,
			matched: result.matchedCount,
			modified: result.modifiedCount,
		});
	} catch (error) {
		throw new MongoAPIError("Failed to insert track stubs", 500, error);
	}
};

export const getTrackInfo = async (uri) => {
	try {
		const trackInfo = await tracks.findOne({ _id: uri });
		const albumInfo = await getAlbumInfo(trackInfo.albumURI);
		trackInfo.images = albumInfo.images;
		return trackInfo;
	} catch (error) {
		throw new MongoAPIError("Failed to get track info", 500, error);
	}
};
