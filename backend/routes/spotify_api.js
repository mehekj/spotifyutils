import axios from "axios";
import express from "express";
import QueryString from "qs";

const REDIRECT_URI = `${process.env.SERVER}/spotify/redirect`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const spotifyRouter = express.Router();

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
];

const generateRandomString = (length) =>
	Math.random().toString(20).substring(2, length);

spotifyRouter.get("/login", (req, res) => {
	var state = generateRandomString(16);
	var scope = scopes.join(" ");

	console.log("User attempting to log in");

	res.redirect(
		"https://accounts.spotify.com/authorize?" +
			QueryString.stringify({
				response_type: "code",
				client_id: CLIENT_ID,
				scope: scope,
				redirect_uri: REDIRECT_URI,
				state: state,
			})
	);
});

spotifyRouter.get("/redirect", (req, res) => {
	if (req.query.error) res.send(req.query.error);
	else if (!req.query.state) res.send("state mismatch");
	else {
		const code = req.query.code;

		console.log("User logged in, requesting Spotify access token");

		axios
			.post(
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
			)
			.then((response) => {
				if (response.status === 200) {
					const { access_token, refresh_token, expires_in } = response.data;
					res.cookie("spotify_access_token", access_token, {
						httpOnly: true,
						maxAge: expires_in * 1000,
						secure: process.env.NODE_ENV === "production",
					});
					res.redirect("/");
				} else {
					res.send("invalid token");
				}
			})
			.catch((error) => {
				res.send(error);
			});
	}
});

spotifyRouter.get("/user", (req, res) => {
	console.log("Fetching Spotify user data");

	const cookies = req.headers.cookie;
	if (!cookies) {
		res.send(401).send("Missing access token");
	}

	const values = cookies.split(";").reduce((res, item) => {
		const data = item.trim().split("=");
		return { ...res, [data[0]]: data[1] };
	}, {});

	if (!values["spotify_access_token"]) {
		return res.status(401).send("Missing access token");
	}

	axios
		.get("https://api.spotify.com/v1/me", {
			headers: { Authorization: `Bearer ${values["spotify_access_token"]}` },
		})
		.then((response) => {
			res.json(response.data);
		})
		.catch((error) => {
			res.status(502).send("Error fetching user data: ", error);
		});
});

/**
 * NEW FLOW
 * client hits login
 * server login route redirects to spotify auth
 * user logs in and spotify redirects to server redirect route
 * server redirect route gets access and refresh tokens from spotify
 * server redirect route stores refresh token in database and sends access token to client as a cookie
 * client attempts to make requests to spotify api routes with access token cookie
 * if access token expired, client hits refresh token route
 * server refresh token route gets refresh token from database, requests new access token from spotify, and sends it to client as a cookie
 */
