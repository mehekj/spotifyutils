import axios from "axios";
import QueryString from "qs";
import { logDebug, logError } from "./logger.js";
import { getUserData } from "./spotify.js";

export const REDIRECT_URI = `${process.env.SERVER}/auth/redirect`;
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;

const ACCESS_TOKEN_COOKIE = "spotify_access_token";
const REFRESH_TOKEN_COOKIE = "spotify_refresh_token";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const getSpotifyAuthHeaders = () => ({
	"content-type": "application/x-www-form-urlencoded",
	Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
});

const buildSpotifyTokenPayload = (grantType, extraPayload = {}) => {
	return QueryString.stringify({
		grant_type: grantType,
		...extraPayload,
	});
};

export const generateRandomString = (length) => {
	const safeLength = Math.max(1, Number(length) || 0);
	return Math.random()
		.toString(20)
		.slice(2, 2 + safeLength);
};

export const getTokenCookies = (req) => {
	const cookies = req?.headers?.cookie;
	if (!cookies) {
		return { accessToken: null, refreshToken: null };
	}

	return cookies.split(";").reduce(
		(tokens, entry) => {
			const [rawName, ...rawValue] = entry.trim().split("=");
			if (!rawName) {
				return tokens;
			}

			const name = rawName.trim();
			const value = rawValue.join("=");

			if (name === ACCESS_TOKEN_COOKIE) {
				tokens.accessToken = value;
			}

			if (name === REFRESH_TOKEN_COOKIE) {
				tokens.refreshToken = value;
			}

			return tokens;
		},
		{ accessToken: null, refreshToken: null },
	);
};

export const setTokenCookies = (res, accessToken, refreshToken, expiresIn) => {
	logDebug("auth", "updated Spotify tokens", { expiresIn });

	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	};

	res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
		...cookieOptions,
		maxAge: expiresIn * 1000,
	});

	res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);
};

export const clearTokenCookies = (res) => {
	res.clearCookie(ACCESS_TOKEN_COOKIE);
	res.clearCookie(REFRESH_TOKEN_COOKIE);
};

const exchangeSpotifyToken = async (payload) => {
	try {
		const response = await axios.post(SPOTIFY_TOKEN_URL, payload, {
			headers: getSpotifyAuthHeaders(),
		});

		return response.data;
	} catch (err) {
		logError("auth", "failed to exchange Spotify token", err, {
			status: err.response?.status,
		});
		return null;
	}
};

export const exchangeSpotifyAuthorizationCode = async (code, redirectUri = REDIRECT_URI) => {
	return exchangeSpotifyToken(
		buildSpotifyTokenPayload("authorization_code", {
			code,
			redirect_uri: redirectUri,
		}),
	);
};

export const refreshSpotifyToken = async (refreshToken, res) => {
	const tokenResponse = await exchangeSpotifyToken(
		buildSpotifyTokenPayload("refresh_token", { refresh_token: refreshToken }),
	);
	if (!tokenResponse) {
		return null;
	}

	const accessToken = tokenResponse.access_token;
	const nextRefreshToken = tokenResponse.refresh_token || refreshToken;
	const expiresIn = tokenResponse.expires_in || 3600;
	setTokenCookies(res, accessToken, nextRefreshToken, expiresIn);

	return { accessToken, refreshToken: nextRefreshToken };
};

export const getClientCredentialsAccessToken = async () => {
	const tokenResponse = await exchangeSpotifyToken(buildSpotifyTokenPayload("client_credentials"));
	if (!tokenResponse) {
		return null;
	}

	const accessToken = tokenResponse.access_token || null;
	const expiresIn = Number(tokenResponse.expires_in || 0);

	return {
		accessToken,
		expiresIn,
	};
};

export const requireSpotifyAuth = async (req, res, next) => {
	const tokens = getTokenCookies(req);
	const accessToken = tokens.accessToken;
	const refreshToken = tokens.refreshToken;

	if (!refreshToken && !accessToken) {
		return res.status(401).json({ message: "Login required" });
	}

	try {
		if (!accessToken && refreshToken) {
			const refreshedTokens = await refreshSpotifyToken(refreshToken, res);
			if (!refreshedTokens?.accessToken) {
				return res.status(401).json({ message: "Invalid refresh token" });
			}
			req.accessToken = refreshedTokens.accessToken;
		}

		return next();
	} catch (err) {
		logError("auth", "Spotify auth middleware error", err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const attachSpotifyUser = async (req, res, next) => {
	try {
		const user = await getUserData(req, res);
		if (!user || !user.id) {
			return res.status(401).json({ message: "Could not retrieve Spotify user info" });
		}
		req.user = user;
		return next();
	} catch (err) {
		logError("auth", "failed to retrieve Spotify user profile", err);
		return res.status(500).json({ message: "Failed to fetch Spotify user profile" });
	}
};
