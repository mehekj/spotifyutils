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
		return users.findOne({ user: userID });
	} catch (err) {
		"MongoDB API request failed",
			err.response?.status || 500,
			err.response?.data || err.message;
	}
};
