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
