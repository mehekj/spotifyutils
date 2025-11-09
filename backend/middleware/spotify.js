import { getTokenCookies, refreshSpotifyToken } from "./auth.js";
import axios from "axios";

export class SpotifyAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "SpotifyAPIError";
		this.status = status;
		this.details = details;
	}
}

export const spotifyRequest = async (req, res, endpoint, options = {}) => {
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
		const tokens = getTokenCookies(req);
		const refreshToken = tokens.refreshToken;

		console.log(`${baseUrl}${endpoint}`, req, status, tokens, err);

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
