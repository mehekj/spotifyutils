import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { getArtistStreams } from "../utils/mongo.js";
import {
	getSpotifyItemId,
	spotifyDelete,
	spotifyGet,
	spotifyPut,
	getSpotifyArtistUriFromId,
} from "../utils/spotify.js";

export const artistsRouter = express.Router();

artistsRouter.use(requireSpotifyAuth, attachSpotifyUser);

artistsRouter.get("/:uri/info", async (req, res, next) => {
	try {
		const response = await spotifyGet(req, res, `/artists/${req.params.uri}`);
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
			`/me/library/contains?uris=${getSpotifyArtistUriFromId(req.params.uri)}`,
		);
		res.json(response[0]);
	} catch (err) {
		next(err);
	}
});

artistsRouter.put("/:uri/following", async (req, res, next) => {
	try {
		await spotifyPut(
			req,
			res,
			`/me/library?uris=${getSpotifyArtistUriFromId(req.params.uri)}`,
		);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.delete("/:uri/following", async (req, res, next) => {
	try {
		await spotifyDelete(
			req,
			res,
			`/me/library?uris=${getSpotifyArtistUriFromId(req.params.uri)}`,
		);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.get("/:uri/streams", async (req, res, next) => {
	console.log(
		`Fetching user ${req.user.display_name}'s streams for artist ${req.params.uri}`,
	);

	try {
		const streams = await getArtistStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
