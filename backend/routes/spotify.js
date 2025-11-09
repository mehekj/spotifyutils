import express from "express";
import { SpotifyAPIError, spotifyRequest } from "../middleware/spotify.js";
import { requireSpotifyAuth } from "../middleware/auth.js";

export const spotifyRouter = express.Router();

spotifyRouter.use((err, req, res, next) => {
	if (err instanceof SpotifyAPIError) {
		console.error("Spotify request error:", err);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

spotifyRouter.get("/me", requireSpotifyAuth(), async (req, res, next) => {
	console.log("Fetching Spotify user data");

	try {
		const user = await spotifyRequest(req, res, "/me");
		res.json(user);
	} catch (err) {
		next(err);
	}
});
