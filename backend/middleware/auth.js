import axios from "axios";
import QueryString from "qs";
import { getUserData } from "./spotify.js";

export const REDIRECT_URI = `${process.env.SERVER}/auth/redirect`;
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const generateRandomString = (length) =>
	Math.random().toString(20).substring(2, length);

export const getTokenCookies = (req) => {
	let tokens = { accessToken: null, refreshToken: null };

	const cookies = req.headers.cookie;
	if (!cookies) {
		return tokens;
	}

	const values = cookies.split(";").reduce((res, item) => {
		const data = item.trim().split("=");
		return { ...res, [data[0]]: data[1] };
	}, {});

	if (values["spotify_access_token"]) {
		tokens.accessToken = values["spotify_access_token"];
	}

	if (values["spotify_refresh_token"]) {
		tokens.refreshToken = values["spotify_refresh_token"];
	}

	return tokens;
};

export const setTokenCookies = (res, accessToken, refreshToken, expiresIn) => {
	console.log("Updated spotify tokens");
	res.cookie("spotify_access_token", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: expiresIn * 1000,
	});
	res.cookie("spotify_refresh_token", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});
};

export const refreshSpotifyToken = async (refreshToken, res) => {
	try {
		const response = await axios.post(
			"https://accounts.spotify.com/api/token",
			QueryString.stringify({
				grant_type: "authorization_code",
				refresh_token: refreshToken,
			}),
			{
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${Buffer.from(
						`${CLIENT_ID}:${CLIENT_SECRET}`
					).toString("base64")}`,
				},
			}
		);

		const newAccessToken = response.data.spotify_access_token;
		const newRefreshToken = response.data.spotify_refresh_token || refreshToken;
		const expiresIn = response.data.expires_in || 3600;
		setTokenCookies(res, newAccessToken, newRefreshToken, expiresIn);

		return newAccessToken;
	} catch (err) {
		console.error("Failed to refresh token:", err.response?.data || err);
		return null;
	}
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
			const newAccessToken = await refreshSpotifyToken(refreshToken, res);
			if (!newAccessToken) {
				return res.status(401).json({ message: "Invalid refresh token" });
			}
			req.accessToken = newAccessToken;
		}

		req.accessToken = accessToken;
		return next();
	} catch (err) {
		console.error("Spotify auth middleware error:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const attachSpotifyUser = async (req, res, next) => {
	try {
		const user = await getUserData(req, res);
		if (!user || !user.id) {
			return res
				.status(401)
				.json({ message: "Could not retrieve Spotify user info" });
		}
		req.user = user;
		return next();
	} catch (err) {
		console.error("Error getting Spotify user:", err.message);
		return res
			.status(500)
			.json({ message: "Failed to fetch Spotify user profile" });
	}
};
