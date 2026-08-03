import "../environment.js";
import { MongoClient } from "mongodb";
import { logError } from "../utils/logger.js";

const connectionString = process.env.MONGO_URI || "";

const client = new MongoClient(connectionString);

let conn;
try {
	conn = await client.connect();
} catch (err) {
	logError("mongo", "failed to connect to MongoDB", err);
}

let db = conn.db("decodify");
export const users = db.collection("users");
export const streams = db.collection("streams");
export const tracks = db.collection("tracks");
export const artists = db.collection("artists");
export const albums = db.collection("albums");
