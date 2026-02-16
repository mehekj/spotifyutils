import express from "express";
import { requireSpotifyAuth, attachSpotifyUser } from "../utils/auth.js";
import {
	getTopTracks,
	getBottomTracks,
	getTrackStreams,
} from "../utils/mongo.js";
import { spotifyDelete, spotifyGet, spotifyPut } from "../utils/spotify.js";

export const tracksRouter = express.Router();

tracksRouter.use(requireSpotifyAuth, attachSpotifyUser);

tracksRouter.get("/top", async (req, res, next) => {
	const limit = parseInt(req.query.limit) || 20;
	console.log(`Fetching top ${limit} for user:`, req.user.display_name);

	try {
		const userID = req.user.id;
		const tracks = await getTopTracks(userID, limit);

		const ids = tracks.map((track) => track._id.split(":")[2]);
		const idStr = ids.join("%2C");
		const likedRes = await spotifyGet(
			req,
			res,
			`/me/tracks/contains?ids=${idStr}`,
		);
		tracks.forEach((track, i) => (track.liked = likedRes[i]));

		res.json(tracks);
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

		const ids = tracks.map((track) => track._id.split(":")[2]);
		const idStr = ids.join("%2C");
		const likedRes = await spotifyGet(
			req,
			res,
			`/me/tracks/contains?ids=${idStr}`,
		);
		tracks.forEach((track, i) => (track.liked = likedRes[i]));

		res.json(tracks);
	} catch (err) {
		next(err);
	}
});

tracksRouter.get("/:uri/streams", async (req, res, next) => {
	console.log(
		`Fetching user ${req.user.display_name}'s streams for track ${req.params.uri}`,
	);

	try {
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
		const id = req.params.uri.split(":")[2];
		const response = await spotifyGet(req, res, `/tracks/${id}`);
		res.json(response);
	} catch (err) {
		next(err);
	}
});
