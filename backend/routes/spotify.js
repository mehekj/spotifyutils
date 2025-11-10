import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../middleware/auth.js";
import { getUserUpload } from "../middleware/mongo.js";

export const spotifyRouter = express.Router();

spotifyRouter.use(requireSpotifyAuth, attachSpotifyUser);

spotifyRouter.get("/me", async (req, res, next) => {
	console.log("Fetching Spotify user data for user:", req.user.display_name);

	try {
		const user = req.user;
		const lastUpload = await getUserUpload(user.id);
		user.lastUpload = lastUpload.time;
		res.json(user);
	} catch (err) {
		next(err);
	}
});
