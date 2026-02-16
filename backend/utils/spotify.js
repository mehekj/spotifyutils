import axios from "axios";
import { getTokenCookies, refreshSpotifyToken } from "./auth.js";

export class SpotifyAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "SpotifyAPIError";
		this.status = status;
		this.details = details;
	}
}

const spotifyRequest = async (req, res, endpoint, options = {}) => {
	const baseUrl = "https://api.spotify.com/v1";
	const tokens = getTokenCookies(req);
	const accessToken = tokens.accessToken;
	const refreshToken = tokens.refreshToken;
	try {
		const result = await axios({
			url: `${baseUrl}${endpoint}`,
			headers: { Authorization: `Bearer ${accessToken}` },
			...options,
		});
		return result.data;
	} catch (err) {
		const status = err.response?.status;

		if (status === 401 && refreshToken) {
			console.warn("Access token expired - attempting refresh...");

			const newAccessToken = await refreshSpotifyToken(refreshToken, res);
			if (!newAccessToken) {
				throw new SpotifyAPIError(
					"Failed to refresh Spotify access token",
					401,
				);
			}

			try {
				const retry = await axios({
					url: `${baseUrl}${endpoint}`,
					headers: { Authorization: `Bearer ${newAccessToken}` },
					...options,
				});
				return retry.data;
			} catch (retryErr) {
				throw new SpotifyAPIError(
					"Spotify API request failed after refresh",
					retryErr.response?.status,
					retryErr.response?.data,
				);
			}
		}

		throw new SpotifyAPIError(
			"Spotify API request failed",
			status || 500,
			err.response?.data || err.message,
		);
	}
};

export const spotifyGet = (req, res, endpoint, params = {}) =>
	spotifyRequest(req, res, endpoint, { method: "GET", params });

export const spotifyPost = (req, res, endpoint, data = {}) =>
	spotifyRequest(req, res, endpoint, { method: "POST", data });

export const spotifyPut = (req, res, endpoint, data = {}) =>
	spotifyRequest(req, res, endpoint, { method: "PUT", data });

export const spotifyDelete = (req, res, endpoint, data = {}) =>
	spotifyRequest(req, res, endpoint, { method: "DELETE", data });

export const getUserData = async (req, res) => {
	return spotifyGet(req, res, "/me");
};
