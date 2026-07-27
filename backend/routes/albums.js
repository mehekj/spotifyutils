import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { getAlbumStreams } from "../utils/mongo.js";
import { spotifyGet } from "../utils/spotify.js";

export const albumsRouter = express.Router();

albumsRouter.use(requireSpotifyAuth, attachSpotifyUser);

albumsRouter.get("/:uri/info", async (req, res, next) => {
	try {
		const response = await spotifyGet(req, res, `/albums/${req.params.uri}`);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

albumsRouter.get("/:uri/streams", async (req, res, next) => {
	try {
		const streams = await getAlbumStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
