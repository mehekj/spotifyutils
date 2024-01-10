import axios from "axios";
import express from "express";
import QueryString from "qs";
import { config } from "./constants.js";
import multer from "multer";
import {
	deleteStreams,
	insertStreams,
	deleteUserStreams,
	setUserUpload,
	getUserUpload,
} from "./db_api.js";

const router = express.Router();

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
				client_id: CLIENT_ID,
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

router.get("/userData", async (req, res) => {
	const { userID } = req.query;
	const data = await getUserUpload(userID);
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	res.send(data);
});

let chunks = {};
let totalChunks = {};
let chunksPerFile = {};

router.post("/beginUpload", (req, res) => {
	const user = req.body.userID;
	chunks[user] = [];
	totalChunks[user] = req.body.totalChunks;
	chunksPerFile[user] = req.body.chunksPerFile;
	res
		.status(200)
		.send(
			"beginning upload of " + totalChunks[user] + " chunks for user " + user
		);
});

const upload = multer();

router.post("/upload", upload.single("chunk"), async (req, res) => {
	const user = req.body.userID;
	let chunk = req.file;
	chunks[user].push(chunk);
	if (chunks[user].length === totalChunks[user]) {
		const compareFn = (a, b) => {
			const aIndex = parseInt(a["originalname"]);
			const bIndex = parseInt(b["originalname"]);
			return aIndex - bIndex;
		};

		chunks[user].sort(compareFn);

		let fileBuffers = [];
		let chunkIndex = 0;
		chunksPerFile[user].map((fileChunks, fileIndex) => {
			fileBuffers.push([]);
			for (let i = 0; i < fileChunks; i++) {
				fileBuffers[fileIndex].push(chunks[user][chunkIndex + i].buffer);
			}
			chunkIndex += fileChunks;
		});

		let extraFields = [
			"username",
			"ip_addr_decrypted",
			"user_agent_decrypted",
			"episode_name",
			"episode_show_name",
			"spotify_episode_uri",
			"offline_timestamp",
		];

		let promises = [];
		let streams = [];
		fileBuffers.map((buffs) => {
			const completeFile = new Blob(buffs);
			promises.push(
				completeFile
					.text()
					.then((text) => {
						let json = JSON.parse(text);

						json.forEach((item) => {
							extraFields.forEach((key) => {
								delete item[key];
							});

							item["user"] = user;
						});

						streams.push(...json);
					})
					.catch((err) => console.error(err))
			);
		});

		Promise.all(promises)
			.then(() => {
				deleteUserStreams(user).then(
					insertStreams(streams).then(
						setUserUpload(user).then(
							console.log("uploaded", streams.length, "streams")
						)
					)
				);
			})
			.catch((err) => console.error(err));
	}

	const response =
		"uploaded chunk " + chunks[user].length + "/" + totalChunks[user];
	res.status(200).send(response);
});

export default router;
