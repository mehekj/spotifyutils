import axios from "axios";
import express from "express";
import QueryString from "qs";

const REDIRECT_URI = `${process.env.SERVER}/auth/redirect`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const authRouter = express.Router();

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
];

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

const setTokenCookies = (res, accessToken, refreshToken, expiresIn) => {
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

const refreshSpotifyToken = async (refreshToken, res) => {
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

export const requireSpotifyAuth = () => {
	return async (req, res, next) => {
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
};

const generateRandomString = (length) =>
	Math.random().toString(20).substring(2, length);

authRouter.get("/login", (req, res) => {
	var state = generateRandomString(16);
	var scope = scopes.join(" ");

	console.log("User attempting to log in, redirect: ", REDIRECT_URI);

	res.redirect(
		"https://accounts.spotify.com/authorize?" +
			QueryString.stringify({
				response_type: "code",
				client_id: CLIENT_ID,
				scope: scope,
				redirect_uri: REDIRECT_URI,
				state: state,
				show_dialog: true,
			})
	);
});

authRouter.get("/redirect", async (req, res) => {
	if (req.query.error) res.send(req.query.error);
	else if (!req.query.state) res.send("Authorization code state mismatch");
	else {
		const code = req.query.code;

		console.log("User logged in, requesting Spotify access token");

		try {
			const response = await axios.post(
				"https://accounts.spotify.com/api/token",
				QueryString.stringify({
					grant_type: "authorization_code",
					code: code,
					redirect_uri: REDIRECT_URI,
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

			if (response.status === 200) {
				const { access_token, refresh_token, expires_in } = response.data;
				setTokenCookies(res, access_token, refresh_token, expires_in);
				res.redirect(
					`${
						process.env.NODE_ENV === "production" ? "" : "http://localhost:3000"
					}/`
				);
			} else {
				res.status(500).send("Invalid token");
			}
		} catch (err) {
			res.status(500).send("Error getting tokens:", err.message);
		}
	}
});

authRouter.post("/logout", (req, res) => {
	console.log("User logging out");
	res.clearCookie("spotify_access_token");
	res.clearCookie("spotify_refresh_token");
	res.end();
});
