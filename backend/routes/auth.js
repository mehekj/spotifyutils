import axios from "axios";
import express from "express";
import QueryString from "qs";
import {
	CLIENT_ID,
	CLIENT_SECRET,
	generateRandomString,
	REDIRECT_URI,
	setTokenCookies,
} from "../middleware/auth.js";

export const authRouter = express.Router();

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
];

authRouter.get("/login", (req, res) => {
	const state = generateRandomString(16);
	const scope = scopes.join(" ");

	console.log("User attempting to log in, redirect:", REDIRECT_URI);

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
	if (req.query.error) {
		return res.status(400).json({ message: req.query.error });
	}

	if (!req.query.state) {
		return res
			.status(400)
			.json({ message: "Authorization code state mismatch" });
	}

	const code = req.query.code;
	console.log("User logged in, requesting Spotify access token");

	try {
		const response = await axios.post(
			"https://accounts.spotify.com/api/token",
			QueryString.stringify({
				grant_type: "authorization_code",
				code,
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

		const { access_token, refresh_token, expires_in } = response.data;
		setTokenCookies(res, access_token, refresh_token, expires_in);

		const redirectBase =
			process.env.NODE_ENV === "production" ? "" : "http://localhost:3000";
		res.redirect(`${redirectBase}/`);
	} catch (err) {
		console.error("Error getting tokens:", err.message);
		res.status(500).json({ message: "Failed to retrieve access token" });
	}
});

authRouter.post("/logout", (req, res) => {
	console.log("User logging out");
	res.clearCookie("spotify_access_token");
	res.clearCookie("spotify_refresh_token");
	res.end();
});
