import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { spotifyDelete, spotifyGet, spotifyPut } from "../utils/spotify.js";
import { getArtistStreams } from "../utils/mongo.js";

export const artistsRouter = express.Router();

artistsRouter.use(requireSpotifyAuth, attachSpotifyUser);

artistsRouter.get("/:name/info", async (req, res, next) => {
	try {
		const response = await spotifyGet(
			req,
			res,
			`/search?q=artist:${req.params.name}&type=artist&limit=1`,
		);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

artistsRouter.get("/:uri/following", async (req, res, next) => {
	try {
		const response = await spotifyGet(
			req,
			res,
			`/me/library/contains?uris=${req.params.uri}`,
		);
		res.json(response[0]);
	} catch (err) {
		next(err);
	}
});

artistsRouter.put("/:uri/following", async (req, res, next) => {
	try {
		await spotifyPut(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.delete("/:uri/following", async (req, res, next) => {
	try {
		await spotifyDelete(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.get("/:name/streams", async (req, res, next) => {
	console.log(
		`Fetching user ${req.user.display_name}'s streams for artist ${req.params.name}`,
	);

	try {
		const streams = await getArtistStreams(req.user.id, req.params.name);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
