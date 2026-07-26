import express from "express";
import { requireSpotifyAuth, attachSpotifyUser } from "../utils/auth.js";
import {
	getTopTracks,
	getBottomTracks,
	getTrackStreams,
} from "../utils/mongo.js";
import {
	spotifyDelete,
	spotifyGet,
	spotifyPut,
	getOrEnrichTrack,
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
					`/me/library/contains?uris=${uris.join(",")}`,
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
	console.log(`Fetching top ${limit} for user:`, req.user.display_name);

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
	console.log(`Fetching bottom ${limit} for user:`, req.user.display_name);

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
	console.log(
		`Fetching user ${req.user.display_name}'s streams for track ${req.params.uri}`,
	);

	try {
		await getOrEnrichTrack(req, res, req.params.uri);
		const streams = await getTrackStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});

tracksRouter.put("/:uri/like", async (req, res, next) => {
	try {
		await spotifyPut(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

tracksRouter.delete("/:uri/like", async (req, res, next) => {
	try {
		await spotifyDelete(req, res, `/me/library?uris=${req.params.uri}`);
		res.end();
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/like", async (req, res, next) => {
	try {
		const response = await spotifyGet(
			req,
			res,
			`/me/library/contains?uris=${req.params.uri}`,
		);
		res.json(response);
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/info", async (req, res, next) => {
	try {
		const response = await getOrEnrichTrack(req, res, req.params.uri);
		res.json(response);
	} catch (err) {
		next(err);
	}
});
