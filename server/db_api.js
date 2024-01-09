import db, { users, streams } from "./conn.js";

export const deleteStreams = async () => {
	streams.deleteMany({});
};

export const deleteUserStreams = async (userID) => {
	streams.deleteMany({ user: userID });
};

export const insertStreams = async (data) => {
	streams
		.insertMany(data)
		.then(console.log("inserted", data.length, "documents"))
		.catch((err) => console.error(err));
};

export const setUserUpload = async (userID) => {
	users.updateOne(
		{ user: userID },
		{ $set: { user: userID, time: Date.now() } },
		{ upsert: true }
	);
};

export const getUserUpload = async (userID) => {
	return users.findOne({ user: userID });
};
