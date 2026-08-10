import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { getArtistStreams } from "../db/streams.js";
import {
	getSpotifyArtistUriFromId,
	spotifyDelete,
	spotifyGet,
	spotifyPut,
} from "../utils/spotify.js";
import { logDebug } from "../utils/logger.js";
import { getArtistInfo } from "../db/artists.js";

export const artistsRouter = express.Router();

artistsRouter.use(requireSpotifyAuth, attachSpotifyUser);

artistsRouter.get("/:uri/info", async (req, res, next) => {
	logDebug("artists", "fetching artist info", {
		userId: req.user.id,
		artistUri: req.params.uri,
	});

	try {
		const artistInfo = await getArtistInfo(req.params.uri);
		res.json(artistInfo);
	} catch (err) {
		next(err);
	}
});

artistsRouter.get("/:uri/following", async (req, res, next) => {
	logDebug("artists", "fetching artist following status", {
		userId: req.user.id,
		artistUri: req.params.uri,
	});

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
	logDebug("artists", "following artist", {
		userId: req.user.id,
		artistUri: req.params.uri,
	});

	try {
		await spotifyPut(req, res, `/me/library?uris=${getSpotifyArtistUriFromId(req.params.uri)}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.delete("/:uri/following", async (req, res, next) => {
	logDebug("artists", "unfollowing artist", {
		userId: req.user.id,
		artistUri: req.params.uri,
	});

	try {
		await spotifyDelete(req, res, `/me/library?uris=${getSpotifyArtistUriFromId(req.params.uri)}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

artistsRouter.get("/:uri/streams", async (req, res, next) => {
	logDebug("artists", "fetching artist streams", {
		userId: req.user.id,
		artistUri: req.params.uri,
	});

	try {
		const streams = await getArtistStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
