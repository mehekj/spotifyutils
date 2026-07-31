import express from "express";
import multer from "multer";
import { deleteUserStreams } from "../db/streams.js";
import { getUserUpload, setUserUpload } from "../db/users.js";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { uploadChunk } from "../utils/files.js";
import { logDebug } from "../utils/logger.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const usersRouter = express.Router();

usersRouter.use(requireSpotifyAuth, attachSpotifyUser);

usersRouter.get("/me", async (req, res, next) => {
	logDebug("users", "fetching current user profile", req.user);

	try {
		const user = req.user;
		res.json(user);
	} catch (err) {
		next(err);
	}
});

usersRouter.get("/me/uploads/last", async (req, res, next) => {
	logDebug("users", "fetching last upload time", { userId: req.user.id });

	try {
		const lastUpload = await getUserUpload(req.user.id);
		res.json({ lastUpload: lastUpload });
	} catch (err) {
		next(err);
	}
});

usersRouter.put("/me/uploads/last", async (req, res, next) => {
	logDebug("users", "setting last upload time", {
		userId: req.user.id,
		time: req.query.time,
	});

	try {
		await setUserUpload(req.user.id, Number(req.query.time));
		res.end();
	} catch (err) {
		next(err);
	}
});

usersRouter.post("/me/data", upload.single("chunk"), async (req, res, next) => {
	logDebug("users", "uploading data chunk", { userId: req.user.id });

	try {
		const chunk = req.file.buffer;
		const chunkNum = Number(req.body.chunkNum);
		const totalChunks = Number(req.body.totalChunks);
		const fileNum = Number(req.body.fileNum);
		const userID = req.user.id;
		const uploadTime = Number(req.body.uploadTime);

		await uploadChunk(
			chunk,
			chunkNum,
			totalChunks,
			fileNum,
			userID,
			uploadTime,
		);
		res.end();
	} catch (err) {
		next(err);
	}
});

usersRouter.delete("/me/data", async (req, res, next) => {
	logDebug("users", "deleting previous user data", {
		userId: req.user.id,
		uploadTime: req.query.time,
	});

	try {
		await deleteUserStreams(req.user.id, Number(req.query.time));
		res.end();
	} catch (err) {
		next(err);
	}
});
