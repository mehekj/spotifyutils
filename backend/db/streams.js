import { logDebug } from "../utils/logger.js";
import { MongoAPIError } from "../utils/mongo.js";
import { getSpotifyItemId } from "../utils/spotify.js";
import { streams } from "./conn.js";

export const deleteUserStreams = async (userID, uploadTime) => {
	try {
		await streams.deleteMany({ user: userID, uploadTime: { $ne: uploadTime } });
	} catch (error) {
		throw new MongoAPIError("Failed to delete user streams", 500, error);
	}
};

export const insertStreams = async (data) => {
	try {
		const streamDocs = data.map(
			({ name, artistNames, albumName, spotifyTrackURI, ts, ...entry }) => {
				const trackURI = getSpotifyItemId(spotifyTrackURI);
				const artistNamesArray = artistNames.split(",").map((name) => name.trim());
				const date = new Date(ts);
				return {
					spotifyTrackURI: trackURI,
					name: name,

					artistURIs: [],
					artistNames: artistNamesArray,

					albumURI: null,
					albumName: albumName,

					durationMs: null,
					explicit: null,

					ts: date,

					metadataComplete: false,

					...entry,
				};
			},
		);
		const result = await streams.insertMany(streamDocs, { ordered: false });
		logDebug("mongo", "inserted stream documents", {
			insertedCount: result.insertedCount,
		});
	} catch (error) {
		throw new MongoAPIError("Failed to insert streams", 500, error);
	}
};

export const getTotalStreams = async (userID, uploadTime) => {
	try {
		const totalStreams = await streams.countDocuments({ user: userID, uploadTime });
		return totalStreams;
	} catch (error) {
		throw new MongoAPIError("Failed to get total streams", 500, error);
	}
};

export const getIndexedStreams = async (userID, uploadTime) => {
	try {
		const indexedStreams = await streams.countDocuments({
			user: userID,
			uploadTime,
			metadataComplete: true,
		});
		return indexedStreams;
	} catch (error) {
		throw new MongoAPIError("Failed to get indexed streams", 500, error);
	}
};

export const getTopTracks = async (userID, limit = 20) => {
	try {
		const pipeline = [
			{
				$match: {
					user: "mehekyj",
					msPlayed: {
						$gt: 30000,
					},
					spotifyTrackURI: {
						$type: "string",
					},
				},
			},
			{
				$group: {
					_id: "$spotifyTrackURI",
					name: {
						$first: "$name",
					},
					artistURIs: {
						$first: "$artistURIs",
					},
					artistNames: {
						$first: "$artistNames",
					},
					albumURI: {
						$first: "$albumURI",
					},
					albumName: {
						$first: "$albumName",
					},
					durationMs: {
						$first: "$durationMs",
					},
					explicit: {
						$first: "$explicit",
					},
					metadataComplete: {
						$min: "$metadataComplete",
					},
					count: {
						$sum: 1,
					},
				},
			},
			{
				$sort: {
					count: -1,
					_id: 1,
				},
			},
			{
				$limit: 20,
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError(`Failed to get top ${limit} tracks`, 500, error);
	}
};

export const getTrackStreams = async (userID, trackURI) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [{ user: userID }, { spotifyTrackURI: trackURI }],
				},
			},
			{
				$sort: {
					ts: -1,
				},
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get track streams", 500, error);
	}
};

export const getArtistStreams = async (userID, artistUri) => {
	try {
		const pipeline = [
			{
				$match: {
					user: userID,
					artistURIs: artistUri,
				},
			},
			{
				$sort: { ts: -1 },
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get artist streams", 500, error);
	}
};

export const getAlbumStreams = async (userID, albumUri) => {
	try {
		logDebug("mongo", "fetching album streams", { userId: userID, albumUri });
		const pipeline = [
			{
				$match: {
					user: userID,
					albumURI: albumUri,
				},
			},
			{
				$sort: { ts: -1 },
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get album streams", 500, error);
	}
};
