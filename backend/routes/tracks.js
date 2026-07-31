import express from "express";
import {
	getBottomTracks,
	getTopTracks,
	getTrackStreams,
} from "../db/streams.js";
import { getOrEnrichTrack } from "../db/tracks.js";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { logDebug } from "../utils/logger.js";
import {
	getSpotifyTrackUriFromId,
	spotifyDelete,
	spotifyGet,
	spotifyPut,
} from "../utils/spotify.js";

const mergeTrackResults = async (req, res, rows) => {
	const uris = rows
		.map((row) => row.spotify_track_uri || row._id)
		.filter(Boolean);

	const enrichedTracks = await Promise.all(
		uris.map((trackUri) => getOrEnrichTrack(req, res, trackUri)),
	);
	const trackMap = new Map(
		enrichedTracks.filter(Boolean).map((track) => [track._id, track]),
	);

	const likedRes =
		uris.length > 0
			? await spotifyGet(
					req,
					res,
					`/me/library/contains?uris=${uris.map((uri) => getSpotifyTrackUriFromId(uri)).join(",")}`,
				)
			: [];

	return rows.map((row, index) => {
		const trackUri = row.spotify_track_uri || row._id;
		const trackDoc = trackMap.get(trackUri);
		return {
			...row,
			liked: likedRes[index],
			name: trackDoc?.name || null,
			artists: trackDoc?.artists || [],
			album: trackDoc.album || null,
			track: trackDoc,
		};
	});
};

export const tracksRouter = express.Router();

tracksRouter.use(requireSpotifyAuth, attachSpotifyUser);

tracksRouter.get("/top", async (req, res, next) => {
	const limit = parseInt(req.query.limit) || 20;
	logDebug("tracks", "fetching top tracks", { userId: req.user.id, limit });

	try {
		const userID = req.user.id;
		const tracks = await getTopTracks(userID, limit);
		const response = await mergeTrackResults(req, res, tracks);

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
		const response = await mergeTrackResults(req, res, tracks);

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
		await getOrEnrichTrack(req, res, req.params.uri);
		const streams = await getTrackStreams(req.user.id, req.params.uri);
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
		const response = await getOrEnrichTrack(req, res, req.params.uri);
		res.json(response);
	} catch (err) {
		next(err);
	}
});
