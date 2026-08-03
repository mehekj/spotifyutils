import express from "express";
import {
	getBottomTracks,
	getTopTracks,
	getTrackStreams,
} from "../db/streams.js";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { logDebug } from "../utils/logger.js";
import {
	getSpotifyTrackUriFromId,
	spotifyDelete,
	spotifyGet,
	spotifyPut,
} from "../utils/spotify.js";

export const tracksRouter = express.Router();

tracksRouter.use(requireSpotifyAuth, attachSpotifyUser);

tracksRouter.get("/top", async (req, res, next) => {
	const limit = parseInt(req.query.limit) || 20;
	logDebug("tracks", "fetching top tracks", { userId: req.user.id, limit });

	try {
		const userID = req.user.id;
		const tracks = await getTopTracks(userID, limit);

		res.json(response);
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/bottom", async (req, res, next) => {
	const limit = parseInt(req.query.limit) || 20;
	logDebug("tracks", "fetching bottom tracks", { userId: req.user.id, limit });

	try {
		const userID = req.user.id;
		const tracks = await getBottomTracks(userID, limit);

		res.json(response);
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/streams", async (req, res, next) => {
	logDebug("tracks", "fetching track streams", {
		userId: req.user.id,
		trackUri: req.params.uri,
	});

	try {
		//TODO: implement track retrieval again
		res.json(streams);
	} catch (err) {
		next(err);
	}
});

tracksRouter.put("/:uri/like", async (req, res, next) => {
	logDebug("tracks", "liking track", {
		userId: req.user.id,
		trackUri: req.params.uri,
	});

	try {
		await spotifyPut(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

tracksRouter.delete("/:uri/like", async (req, res, next) => {
	logDebug("tracks", "unliking track", {
		userId: req.user.id,
		trackUri: req.params.uri,
	});

	try {
		await spotifyDelete(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/like", async (req, res, next) => {
	logDebug("tracks", "fetching like status", {
		userId: req.user.id,
		trackUri: req.params.uri,
	});

	try {
		const response = await spotifyGet(
			req,
			res,
			`/me/library/contains?uris=${getSpotifyTrackUriFromId(req.params.uri)}`,
		);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/info", async (req, res, next) => {
	logDebug("tracks", "fetching track info", {
		userId: req.user.id,
		trackUri: req.params.uri,
	});

	try {
		//TODO: implement track retrieval again
	} catch (err) {
		next(err);
	}
});
