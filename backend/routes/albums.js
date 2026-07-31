import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { logDebug } from "../utils/logger.js";
import { getAlbumStreams } from "../db/streams.js";
import { spotifyGet } from "../utils/spotify.js";

export const albumsRouter = express.Router();

albumsRouter.use(requireSpotifyAuth, attachSpotifyUser);

albumsRouter.get("/:uri/info", async (req, res, next) => {
	logDebug("albums", "fetching album info", {
		userId: req.user.id,
		albumUri: req.params.uri,
	});

	try {
		const response = await spotifyGet(req, res, `/albums/${req.params.uri}`);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

albumsRouter.get("/:uri/streams", async (req, res, next) => {
	logDebug("albums", "fetching album streams", {
		userId: req.user.id,
		albumUri: req.params.uri,
	});

	try {
		const streams = await getAlbumStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
