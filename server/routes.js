import axios from "axios";
import express from "express";
import QueryString from "qs";
import { config } from "./constants.js";

const router = express.Router();

console.log("environment " + process.env.NODE_ENV);

const REDIRECT_URI = `${config.server}/redirect`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
];

const generateRandomString = (length) =>
	Math.random().toString(20).substring(2, length);

router.get("/login", (req, res) => {
	var state = generateRandomString(16);
	var scope = scopes.join(" ");

	res.redirect(
		"https://accounts.spotify.com/authorize?" +
			QueryString.stringify({
				response_type: "code",
				client_id: process.env.CLIENT_ID,
				scope: scope,
				redirect_uri: REDIRECT_URI,
				state: state,
			})
	);
});

router.get("/redirect", (req, res) => {
	if (req.query.error) res.send(req.query.error);
	else if (!req.query.state) res.send("state mismatch");
	else {
		const code = req.query.code;

		axios({
			method: "post",
			url: "https://accounts.spotify.com/api/token",
			data: QueryString.stringify({
				grant_type: "authorization_code",
				code: code,
				redirect_uri: REDIRECT_URI,
			}),
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				Authorization: `Basic ${new Buffer.from(
					`${CLIENT_ID}:${CLIENT_SECRET}`
				).toString("base64")}`,
			},
		})
			.then((response) => {
				if (response.status === 200) {
					const { access_token, refresh_token, expires_in } = response.data;

					const queryParams = QueryString.stringify({
						access_token,
						refresh_token,
						expires_in,
					});

					res.redirect(`${config.client}/?${queryParams}`);
				} else {
					res.send("invalid token");
				}
			})
			.catch((error) => {
				res.send(error);
			});
	}
});

router.get("/refresh_token", (req, res) => {
	const { refresh_token } = req.query;

	axios({
		method: "post",
		url: "https://accounts.spotify.com/api/token",
		data: QueryString.stringify({
			grant_type: "refresh_token",
			refresh_token: refresh_token,
		}),
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${new Buffer.from(
				`${CLIENT_ID}:${CLIENT_SECRET}`
			).toString("base64")}`,
		},
	})
		.then((response) => {
			res.send(response.data);
		})
		.catch((error) => {
			res.send(error);
		});
});

export default router;
