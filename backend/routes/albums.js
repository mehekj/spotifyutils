import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { spotifyGet } from "../utils/spotify.js";
import { getAlbumStreams } from "../utils/mongo.js";

const getSpotifyAlbumId = (value) => {
	const match = value?.match(/^spotify:album:([a-zA-Z0-9]+)$/);
	return match?.[1] || null;
};

export const albumsRouter = express.Router();

albumsRouter.use(requireSpotifyAuth, attachSpotifyUser);

albumsRouter.get("/:uri/info", async (req, res, next) => {
	try {
		const albumId = getSpotifyAlbumId(req.params.uri);
		const response = albumId
			? await spotifyGet(req, res, `/albums/${albumId}`)
			: await spotifyGet(
					req,
					res,
					`/search?q=album:${req.params.uri}&type=album&limit=1`,
				);
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
