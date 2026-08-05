import axios from "axios";
import { getTokenCookies, refreshSpotifyToken } from "./auth.js";
import { logDebug } from "./logger.js";

export class SpotifyAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "SpotifyAPIError";
		this.status = status;
		this.details = details;
	}
}

export const resolveSpotifyAccessToken = async (req, res, explicitAccessToken = null) => {
	if (explicitAccessToken) {
		return {
			accessToken: explicitAccessToken,
			refreshToken: null,
		};
	}

	const tokens = getTokenCookies(req);
	const accessToken = tokens.accessToken;
	const refreshToken = tokens.refreshToken;

	if (accessToken) {
		return { accessToken, refreshToken };
	}

	if (!refreshToken) {
		throw new SpotifyAPIError("No Spotify access token available", 401);
	}

	const newAccessToken = await refreshSpotifyToken(refreshToken, res);
	if (!newAccessToken) {
		throw new SpotifyAPIError("Failed to refresh Spotify access token", 401);
	}

	return { accessToken: newAccessToken, refreshToken };
};

const spotifyRequest = async (req, res, endpoint, options = {}, explicitAccessToken = null) => {
	const baseUrl = "https://api.spotify.com/v1";
	const { accessToken, refreshToken } = await resolveSpotifyAccessToken(
		req,
		res,
		explicitAccessToken,
	);

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
			logDebug("spotify", "Access token expired - attempting refresh...", {
				userId: req?.user?.id,
				endpoint,
			});

			const refreshedTokens = await refreshSpotifyToken(refreshToken, res);
			if (!refreshedTokens?.accessToken) {
				throw new SpotifyAPIError("Failed to refresh Spotify access token", 401);
			}

			try {
				const retry = await axios({
					url: `${baseUrl}${endpoint}`,
					headers: { Authorization: `Bearer ${refreshedTokens.accessToken}` },
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

export const spotifyGet = (req, res, endpoint, params = {}, accessToken = null) =>
	spotifyRequest(req, res, endpoint, { method: "GET", params }, accessToken);

export const spotifyPost = (req, res, endpoint, data = {}, accessToken = null) =>
	spotifyRequest(req, res, endpoint, { method: "POST", data }, accessToken);

export const spotifyPut = (req, res, endpoint, data = {}, accessToken = null) =>
	spotifyRequest(req, res, endpoint, { method: "PUT", data }, accessToken);

export const spotifyDelete = (req, res, endpoint, data = {}, accessToken = null) =>
	spotifyRequest(req, res, endpoint, { method: "DELETE", data }, accessToken);

export const getUserData = async (req, res) => {
	return spotifyGet(req, res, "/me");
};

export const getSpotifyItemId = (uri) => {
	const parts = uri?.split(":") || [];
	return parts[2] || null;
};

export const isValidSpotifyId = (id) => {
	return typeof id === "string" && /^[a-zA-Z0-9]+$/.test(id);
};

export const isValidSpotifyTrackUri = (uri) => {
	return typeof uri === "string" && /^spotify:track:[a-zA-Z0-9]+$/.test(uri);
};

export const isValidSpotifyArtistUri = (uri) => {
	return typeof uri === "string" && /^spotify:artist:[a-zA-Z0-9]+$/.test(uri);
};

export const isValidSpotifyAlbumUri = (uri) => {
	return typeof uri === "string" && /^spotify:album:[a-zA-Z0-9]+$/.test(uri);
};

export const getSpotifyTrackUriFromId = (id) => {
	if (!isValidSpotifyId(id)) {
		throw new SpotifyAPIError("Invalid Spotify ID", 500);
	}
	return `spotify:track:${id}`;
};

export const getSpotifyArtistUriFromId = (id) => {
	if (!isValidSpotifyId(id)) {
		throw new SpotifyAPIError("Invalid Spotify ID", 500);
	}
	return `spotify:artist:${id}`;
};

export const getSpotifyAlbumUriFromId = (id) => {
	if (!isValidSpotifyId(id)) {
		throw new SpotifyAPIError("Invalid Spotify ID", 500);
	}
	return `spotify:album:${id}`;
};
