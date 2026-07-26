export const getAlbumStreams = async (userID, albumName) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ master_metadata_album_album_name: albumName },
					],
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
		throw new MongoAPIError("Failed to get album streams", 500, error);
	}
};
import { MongoClient } from "mongodb";

const connectionString = process.env.MONGO_URI || "";

const client = new MongoClient(connectionString);

let conn;
try {
	conn = await client.connect();
} catch (err) {
	console.error(err);
}

let db = conn.db("decodify");
const users = db.collection("users");
const streams = db.collection("streams");
const tracks = db.collection("tracks");

export class MongoAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "MongoAPIError";
		this.status = status;
		this.details = details;
	}
}

export const getUserUpload = async (userID) => {
	try {
		const result = await users.findOne({ user: userID });
		if (result) {
			return result.uploadTime;
		} else {
			return null;
		}
	} catch (error) {
		throw new MongoAPIError("Failed to get user upload", 500, error);
	}
};

export const setUserUpload = async (userID, uploadTime) => {
	try {
		await users.updateOne(
			{ user: userID },
			{ $set: { user: userID, uploadTime: uploadTime } },
			{ upsert: true },
		);
	} catch (error) {
		throw new MongoAPIError("Failed to set user upload", 500, error);
	}
};

export const deleteStreams = async () => {
	try {
		await Promise.all([streams.deleteMany({}), tracks.deleteMany({})]);
		console.log("Deleted all stream and track documents");
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

export const deleteUsers = async () => {
	try {
		await users.deleteMany({});
	} catch (error) {
		throw new MongoAPIError("Failed to delete users", 500, error);
	}
};

export const insertTrackStubs = async (data) => {
	try {
		const uniqueTracks = [
			...new Map(
				data.map((entry) => [entry.spotify_track_uri, entry]),
			).values(),
		];

		if (uniqueTracks.length === 0) {
			return;
		}

		const trackDocs = uniqueTracks.map((track) => ({
			_id: track.spotify_track_uri,
			name: track.master_metadata_track_name,
			artist_name: track.master_metadata_album_artist_name,
			artist_uri: null,
			album_name: track.master_metadata_album_album_name,
			album_uri: null,
			duration_ms: null,
			image: {
				small: null,
				medium: null,
				large: null,
			},
			status: "stub",
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		const result = await tracks.insertMany(trackDocs, { ordered: false });
		console.log(`Inserted ${result.insertedCount} track stubs`);
	} catch (error) {
		throw new MongoAPIError("Failed to insert track stubs", 500, error);
	}
};

export const insertStreams = async (data) => {
	try {
		const streamDocs = data.map(
			({
				master_metadata_track_name,
				master_metadata_album_artist_name,
				master_metadata_album_album_name,
				...entry
			}) => ({
				...entry,
			}),
		);
		const result = await streams.insertMany(streamDocs);
		console.log(`Inserted ${result.insertedCount} stream documents`);
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
					master_metadata_track_name: { $first: "$master_metadata_track_name" },
					master_metadata_album_artist_name: {
						$first: "$master_metadata_album_artist_name",
					},
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
					master_metadata_track_name: { $first: "$master_metadata_track_name" },
					master_metadata_album_artist_name: {
						$first: "$master_metadata_album_artist_name",
					},
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

export const getArtistStreams = async (userID, artistName) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ master_metadata_album_artist_name: artistName },
					],
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
		throw new MongoAPIError("Failed to get artist streams", 500, error);
	}
};
