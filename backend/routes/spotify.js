import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../middleware/auth.js";
import { getUserUpload } from "../middleware/mongo.js";
import { spotifyDelete, spotifyPut } from "../middleware/spotify.js";

export const spotifyRouter = express.Router();

spotifyRouter.use(requireSpotifyAuth);

spotifyRouter.get("/me", attachSpotifyUser, async (req, res, next) => {
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

spotifyRouter.put("/track/like", async (req, res, next) => {
	try {
		await spotifyPut(req, res, `/me/tracks?ids=${req.query.id}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

spotifyRouter.delete("/track/unlike", async (req, res, next) => {
	try {
		await spotifyDelete(req, res, `/me/tracks?ids=${req.query.id}`);
		res.end();
	} catch (err) {
		next(err);
	}
});
