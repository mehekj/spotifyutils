import express from "express";
import multer from "multer";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import {
	deleteStreams,
	deleteUserStreams,
	getUserUpload,
	setUserUpload,
} from "../utils/mongo.js";
import { uploadChunk } from "../utils/multer.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const usersRouter = express.Router();

usersRouter.use(requireSpotifyAuth, attachSpotifyUser);

usersRouter.get("/me", async (req, res, next) => {
	console.log("Fetching Spotify user data for user:", req.user.display_name);

	try {
		const user = req.user;
		res.json(user);
	} catch (err) {
		next(err);
	}
});

usersRouter.get("/me/uploads/last", async (req, res, next) => {
	try {
		const lastUpload = await getUserUpload(req.user.id);
		res.json({ lastUpload: lastUpload });
	} catch (err) {
		next(err);
	}
});

usersRouter.put("/me/uploads/last", async (req, res, next) => {
	try {
		await setUserUpload(req.user.id, req.query.time);
		res.end();
	} catch (err) {
		next(err);
	}
});

usersRouter.post("/me/data", upload.single("chunk"), async (req, res, next) => {
	try {
		console.log(req.file);
		console.log(req.body);
		const chunk = req.file.buffer;
		const chunkNum = Number(req.body.chunkNum);
		const totalChunks = Number(req.body.totalChunks);
		const fileNum = req.body.fileNum;
		const userID = req.user.id;
		const uploadTime = req.body.uploadTime;

		await uploadChunk(
			chunk,
			chunkNum,
			totalChunks,
			fileNum,
			userID,
			uploadTime
		);
		res.end();
	} catch (err) {
		next(err);
	}
});

usersRouter.delete("/me/data", async (req, res, next) => {
	try {
		await deleteUserStreams(req.user.id, req.query.time);
		res.end();
	} catch (err) {
		next(err);
	}
});

// this is obviously very bad lol but I need a quick way to wipe the DB for dev
usersRouter.get("/nuke", async (req, res, next) => {
	if (process.env.NODE_ENV === "development") {
		console.log("self destruct button curse you perry the platypus");
		try {
			await deleteStreams();
			res.end();
		} catch (err) {
			next(err);
		}
	}
});
