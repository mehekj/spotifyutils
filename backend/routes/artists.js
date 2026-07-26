import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { spotifyDelete, spotifyGet, spotifyPut } from "../utils/spotify.js";
import { getArtistStreams } from "../utils/mongo.js";

const getSpotifyArtistId = (value) => {
	const match = value?.match(/^spotify:artist:([a-zA-Z0-9]+)$/);
	return match?.[1] || null;
};

export const artistsRouter = express.Router();

artistsRouter.use(requireSpotifyAuth, attachSpotifyUser);

artistsRouter.get("/:uri/info", async (req, res, next) => {
	try {
		const artistId = getSpotifyArtistId(req.params.uri);
		const response = artistId
			? await spotifyGet(req, res, `/artists/${artistId}`)
			: await spotifyGet(
					req,
					res,
					`/search?q=artist:${req.params.uri}&type=artist&limit=1`,
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
