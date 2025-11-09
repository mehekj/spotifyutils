import axios from "axios";
import express from "express";
import { requireSpotifyAuth, getTokenCookies } from "./auth.js";

export const spotifyRouter = express.Router();

class SpotifyAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "SpotifyAPIError";
		this.status = status;
		this.details = details;
	}
}

const spotifyRequest = async (req, res, endpoint, options = {}) => {
	const baseUrl = "https://api.spotify.com/v1";
	const accessToken = req.accessToken;

	try {
		const result = await axios({
			url: `${baseUrl}${endpoint}`,
			headers: { Authorization: `Bearer ${accessToken}` },
			...options,
		});
		return result.data;
	} catch (err) {
		const status = err.response?.status;
		const tokens = getTokenCookies();
		const refreshToken = tokens.refreshToken;

		if (status === 401 && refreshToken) {
			console.warn("Access token expired - attempting refresh...");

			const newAccessToken = await refreshSpotifyToken(refreshToken, res);
			if (!newAccessToken) {
				throw new SpotifyAPIError(
					"Failed to refresh Spotify access token",
					401
				);
			}

			try {
				const retry = await axios({
					url: `${baseUrl}${endpoint}`,
					headers: { Authorization: `Bearer ${accessToken}` },
					...options,
				});
				return retry.data;
			} catch (retryErr) {
				throw new SpotifyAPIError(
					"Spotify API request failed after refresh",
					retryErr.response?.status,
					retryErr.response?.data
				);
			}
		}

		throw new SpotifyAPIError(
			"Spotify API request failed",
			status || 500,
			err.response?.data || err.message
		);
	}
};

spotifyRouter.use((err, req, res, next) => {
	if (err instanceof SpotifyAPIError) {
		console.error("Spotify request error:", err);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server errro" });
});

spotifyRouter.get("/me", requireSpotifyAuth(), async (req, res) => {
	console.log("Fetching Spotify user data");

	try {
		const user = await spotifyRequest(req, res, "/me");
		res.json(user);
	} catch (err) {
		next(err);
	}
});
