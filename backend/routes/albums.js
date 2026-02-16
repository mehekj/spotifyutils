import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { spotifyGet } from "../utils/spotify.js";
import { getAlbumStreams } from "../utils/mongo.js";

export const albumsRouter = express.Router();

albumsRouter.use(requireSpotifyAuth, attachSpotifyUser);

albumsRouter.get("/:name/info", async (req, res, next) => {
	try {
		const response = await spotifyGet(
			req,
			res,
			`/search?q=album:${req.params.name}&type=album&limit=1`,
		);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

albumsRouter.get("/:name/streams", async (req, res, next) => {
	try {
		const streams = await getAlbumStreams(req.user.id, req.params.name);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
