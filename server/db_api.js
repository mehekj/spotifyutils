import db, { users, streams } from "./conn.js";

export const deleteStreams = async () => {
	streams.deleteMany({});
};

export const deleteUserStreams = async (userID) => {
	await streams.deleteMany({ user: userID });
	return;
};

export const insertStreams = async (data) => {
	await streams
		.insertMany(data)
		.then(console.log("inserted", data.length, "documents"))
		.catch((err) => console.error(err));
	return;
};

export const setUserUpload = async (userID) => {
	await users.updateOne(
		{ user: userID },
		{ $set: { user: userID, time: Date.now() } },
		{ upsert: true }
	);
	return;
};

export const getUserUpload = async (userID) => {
	return users.findOne({ user: userID });
};

export const getTop20 = async (userID) => {
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
};
