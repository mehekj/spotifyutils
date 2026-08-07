import { logDebug, logError } from "../utils/logger.js";
import { MongoAPIError } from "../utils/mongo.js";
import { getSpotifyItemId } from "../utils/spotify.js";
import { tracks } from "./conn.js";

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
							images: [],

							metadataJob: {
								status: "pending",
								attempts: 0,
								lockedAt: null,
								updatedAt: new Date(),
							},

							backfillJob: {
								status: "nometadata",
								attempts: 0,
								lockedAt: null,
								updatedAt: new Date(),
							},
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

export const getTrackByUri = async (trackUri) => {
	try {
		return await tracks.findOne({ _id: trackUri });
	} catch (error) {
		throw new MongoAPIError("Failed to get track", 500, error);
	}
};

export const updateTrackFromSpotify = async (trackUri, spotifyTrack) => {
	try {
		const artists = (spotifyTrack?.artists || []).map((artist) => ({
			name: artist?.name || null,
			uri: getSpotifyItemId(artist?.uri) || null,
		}));

		const updatedTrack = {
			_id: trackUri,
			name: spotifyTrack?.name || null,
			artists,
			album: {
				name: spotifyTrack?.album?.name || null,
				uri: getSpotifyItemId(spotifyTrack?.album?.uri) || null,
			},
			duration_ms: spotifyTrack?.duration_ms || null,
			image: {
				small: spotifyTrack?.album?.images?.[2] || null,
				medium: spotifyTrack?.album?.images?.[1] || null,
				large: spotifyTrack?.album?.images?.[0] || null,
			},
			status: "enriched",
			updatedAt: new Date(),
		};

		await tracks.updateOne({ _id: trackUri }, { $set: updatedTrack }, { upsert: true });
		logDebug("mongo", "enriched track metadata", { trackUri });
		return updatedTrack;
	} catch (error) {
		throw new MongoAPIError("Failed to update track from Spotify", 500, error);
	}
};
