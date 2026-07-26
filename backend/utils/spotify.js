import axios from "axios";
import { getTokenCookies, refreshSpotifyToken } from "./auth.js";
import {
	createTrackStub,
	getTrackByUri,
	updateTrackFromSpotify,
} from "./mongo.js";

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

const pendingTrackEnrichments = new Map();

const getSpotifyTrackId = (trackUri) => {
	const parts = trackUri?.split(":") || [];
	return parts[2] || null;
};

export const getOrEnrichTrack = async (req, res, trackUri) => {
	if (!trackUri) {
		return null;
	}

	const existingTrack = await getTrackByUri(trackUri);
	if (existingTrack?.status === "enriched") {
		console.log(`Track metadata already enriched for ${trackUri}`);
		return existingTrack;
	}

	if (pendingTrackEnrichments.has(trackUri)) {
		console.log(`Track enrichment already in progress for ${trackUri}`);
		return pendingTrackEnrichments.get(trackUri);
	}

	const pendingPromise = (async () => {
		try {
			await createTrackStub(trackUri);

			const spotifyTrackId = getSpotifyTrackId(trackUri);
			if (!spotifyTrackId) {
				throw new SpotifyAPIError("Invalid Spotify track URI", 400, {
					trackUri,
				});
			}

			console.log(`Fetching Spotify metadata for track ${trackUri}`);
			const spotifyTrack = await spotifyGet(
				req,
				res,
				`/tracks/${spotifyTrackId}`,
			);
			return updateTrackFromSpotify(trackUri, spotifyTrack);
		} catch (error) {
			console.error(`Failed to enrich track metadata for ${trackUri}`, error);
			throw error;
		}
	})();

	pendingTrackEnrichments.set(trackUri, pendingPromise);
	try {
		return await pendingPromise;
	} finally {
		pendingTrackEnrichments.delete(trackUri);
	}
};
