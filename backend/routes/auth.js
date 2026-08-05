import express from "express";
import QueryString from "qs";
import {
	CLIENT_ID,
	clearTokenCookies,
	exchangeSpotifyAuthorizationCode,
	generateRandomString,
	REDIRECT_URI,
	setTokenCookies,
} from "../utils/auth.js";
import { logDebug, logError } from "../utils/logger.js";

export const authRouter = express.Router();

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
	"playlist-modify-public",
	"user-follow-read",
	"user-follow-modify",
];

authRouter.get("/login", (req, res) => {
	const state = generateRandomString(16);
	const scope = scopes.join(" ");

	logDebug("auth", "login requested", { redirectUri: REDIRECT_URI });

	res.redirect(
		"https://accounts.spotify.com/authorize?" +
			QueryString.stringify({
				response_type: "code",
				client_id: CLIENT_ID,
				scope: scope,
				redirect_uri: REDIRECT_URI,
				state: state,
				show_dialog: true,
			}),
	);
});

authRouter.get("/redirect", async (req, res) => {
	if (req.query.error) {
		return res.status(400).json({ message: req.query.error });
	}

	if (!req.query.state) {
		return res.status(400).json({ message: "Authorization code state mismatch" });
	}

	const code = req.query.code;
	logDebug("auth", "token exchange requested");

	try {
		const tokenResponse = await exchangeSpotifyAuthorizationCode(code, REDIRECT_URI);
		if (!tokenResponse) {
			throw new Error("Spotify token exchange returned no response");
		}

		const { access_token, refresh_token, expires_in } = tokenResponse;
		setTokenCookies(res, access_token, refresh_token, expires_in);

		const redirectBase = process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:5173";
		res.redirect(`${redirectBase}/`);
	} catch (err) {
		logError("auth", "failed to exchange Spotify auth code", err);
		res.status(500).json({ message: "Failed to retrieve access token" });
	}
});

authRouter.post("/logout", (req, res) => {
	logDebug("auth", "logout requested");
	clearTokenCookies(res);
	res.end();
});
