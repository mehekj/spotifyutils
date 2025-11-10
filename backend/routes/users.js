import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { getUserUpload } from "../utils/mongo.js";

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
		res.json({ lastUpload: lastUpload.time });
	} catch (err) {
		next(err);
	}
});
