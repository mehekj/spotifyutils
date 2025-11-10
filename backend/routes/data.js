import express from "express";
import { requireSpotifyAuth, attachSpotifyUser } from "../middleware/auth.js";
import { getTop20, getBottom20, getTrackStreams } from "../middleware/mongo.js";
import { spotifyGet } from "../middleware/spotify.js";

export const dataRouter = express.Router();

dataRouter.use(requireSpotifyAuth, attachSpotifyUser);

dataRouter.get("/top20", async (req, res, next) => {
	console.log("Fetching top 20 for user:", req.user.display_name);

	try {
		const userID = req.user.id;
		const top20 = await getTop20(userID);

		const ids = top20.map((track) => track._id.split(":")[2]);
		const idStr = ids.join("%2C");
		const likedRes = await spotifyGet(
			req,
			res,
			`/me/tracks/contains?ids=${idStr}`
		);
		top20.forEach((track, i) => (track.liked = likedRes[i]));

		res.json(top20);
	} catch (err) {
		next(err);
	}
});

dataRouter.get("/bottom20", async (req, res, next) => {
	console.log("Fetching bottom 20 for user:", req.user.display_name);

	try {
		const userID = req.user.id;
		const bottom20 = await getBottom20(userID);

		const ids = bottom20.map((track) => track._id.split(":")[2]);
		const idStr = ids.join("%2C");
		const likedRes = await spotifyGet(
			req,
			res,
			`/me/tracks/contains?ids=${idStr}`
		);
		bottom20.forEach((track, i) => (track.liked = likedRes[i]));

		res.json(bottom20);
	} catch (err) {
		next(err);
	}
});

dataRouter.get("/track/streams", async (req, res, next) => {
	console.log(
		`Fetching user ${req.user.display_name}'s streams for track ${req.query.uri}`
	);

	try {
		const streams = await getTrackStreams(req.user.id, req.query.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
