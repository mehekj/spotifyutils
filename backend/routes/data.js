import express from "express";
import { requireSpotifyAuth, attachSpotifyUser } from "../middleware/auth.js";
import { getTop20 } from "../middleware/mongo.js";

export const dataRouter = express.Router();

dataRouter.use(requireSpotifyAuth, attachSpotifyUser);

dataRouter.get("/top20", async (req, res, next) => {
	console.log("Fetching top 20 for user:", req.user.display_name);

	try {
		const userID = req.user.id;
		const top20 = await getTop20(userID);
		res.json(top20);
	} catch (err) {
		next(err);
	}
});
