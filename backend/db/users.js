import { users } from "./conn.js";
import { MongoAPIError } from "../utils/mongo.js";

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

export const deleteUsers = async () => {
	try {
		await users.deleteMany({});
	} catch (error) {
		throw new MongoAPIError("Failed to delete users", 500, error);
	}
};
