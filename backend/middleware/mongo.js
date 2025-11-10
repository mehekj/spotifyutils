import { MongoClient } from "mongodb";

const connectionString = process.env.MONGO_URI || "";

const client = new MongoClient(connectionString);

let conn;
try {
	conn = await client.connect();
} catch (err) {
	console.error(err);
}

let db = conn.db("spotutils");
const users = db.collection("users");
const streams = db.collection("streams");

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
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get user upload", 500, error);
	}
};

export const setUserUpload = async (userID) => {
	try {
		await users.updateOne(
			{ user: userID },
			{ $set: { user: userID, time: Date.now() } },
			{ upsert: true }
		);
	} catch (error) {
		throw new MongoAPIError("Failed to set user upload", 500, error);
	}
};

export const deleteStreams = async () => {
	try {
		await streams.deleteMany({});
	} catch (error) {
		throw new MongoAPIError("Failed to delete all streams", 500, error);
	}
};

export const deleteUserStreams = async (userID) => {
	try {
		await streams.deleteMany({ user: userID });
	} catch (error) {
		throw new MongoAPIError("Failed to delete user streams", 500, error);
	}
};

export const insertStreams = async (data) => {
	try {
		const result = await streams.insertMany(data);
		console.log(`Inserted ${result.insertedCount} documents`);
	} catch (error) {
		throw new MongoAPIError("Failed to insert streams", 500, error);
	}
};

export const getTop20 = async (userID) => {
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
					track: { $first: "$master_metadata_track_name" },
					artist: { $first: "$master_metadata_album_artist_name" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 20 },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get top 20 tracks", 500, error);
	}
};

export const getBottom20 = async (userID) => {
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
					track: { $first: "$master_metadata_track_name" },
					artist: { $first: "$master_metadata_album_artist_name" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: 1 } },
			{ $limit: 20 },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get bottom 20 tracks", 500, error);
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
