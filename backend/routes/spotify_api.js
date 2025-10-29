import express from "express";
import QueryString from "qs";
import axios from "axios";

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
	console.log(process.env.CLIENT_ID);

	var state = generateRandomString(16);
	var scope = scopes.join(" ");

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

					const queryParams = QueryString.stringify({
						access_token,
						refresh_token,
						expires_in,
					});

					res.send("HELLO SUCCESS");
				} else {
					res.send("invalid token");
				}
			})
			.catch((error) => {
				res.send(error);
			});
	}
});
