import { logDebug } from "../utils/logger.js";
import { MongoAPIError } from "../utils/mongo.js";
import { getSpotifyItemId } from "../utils/spotify.js";
import { streams } from "./conn.js";

export const deleteStreams = async () => {
	try {
		await Promise.all([streams.deleteMany({}), tracks.deleteMany({})]);
		logDebug("mongo", "deleted all stream and track documents");
	} catch (error) {
		throw new MongoAPIError("Failed to delete all streams", 500, error);
	}
};

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
			({
				master_metadata_track_name,
				master_metadata_album_artist_name,
				master_metadata_album_album_name,
				spotify_track_uri,
				...entry
			}) => ({
				spotify_track_uri: getSpotifyItemId(spotify_track_uri),
				...entry,
			}),
		);
		const result = await streams.insertMany(streamDocs, { ordered: false });
		logDebug("mongo", "inserted stream documents", {
			insertedCount: result.insertedCount,
		});
	} catch (error) {
		throw new MongoAPIError("Failed to insert streams", 500, error);
	}
};

export const getTopTracks = async (userID, limit = 20) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ $expr: { $gte: ["$ms_played", 30000] } },
						{ $expr: { $ne: ["$spotify_track_uri", null] } },
					],
				},
			},
			{
				$group: {
					_id: "$spotify_track_uri",
					spotify_track_uri: { $first: "$spotify_track_uri" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: limit },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError(`Failed to get top ${limit} tracks`, 500, error);
	}
};

export const getBottomTracks = async (userID, limit = 20) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ $expr: { $gte: ["$ms_played", 30000] } },
						{ $expr: { $ne: ["$spotify_track_uri", null] } },
					],
				},
			},
			{
				$group: {
					_id: "$spotify_track_uri",
					spotify_track_uri: { $first: "$spotify_track_uri" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: 1 } },
			{ $limit: limit },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError(`Failed to get bottom ${limit} tracks`, 500, error);
	}
};

export const getTrackStreams = async (userID, trackURI) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [{ user: userID }, { spotify_track_uri: trackURI }],
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
				},
			},
			{
				$lookup: {
					from: "tracks",
					let: { trackId: "$spotify_track_uri" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$_id", "$$trackId"] },
										{ $in: [artistUri, "$artists.uri"] },
									],
								},
							},
						},
					],
					as: "track",
				},
			},
			{
				$match: {
					track: { $ne: [] },
				},
			},
			{
				$set: {
					track: { $first: "$track" },
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
				},
			},
			{
				$lookup: {
					from: "tracks",
					let: { trackId: "$spotify_track_uri" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$_id", "$$trackId"] },
										{ $eq: ["$album.uri", albumUri] },
									],
								},
							},
						},
					],
					as: "track",
				},
			},
			{
				$match: {
					track: { $ne: [] },
				},
			},
			{
				$set: {
					track: { $first: "$track" },
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
