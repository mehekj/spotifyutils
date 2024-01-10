import axios from "axios";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import QueryString from "qs";
import { fileURLToPath } from "url";
import { config } from "./constants.js";
import { getUserUpload } from "./db_api.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const REDIRECT_URI = `${config.server}/redirect`;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scopes = [
	"user-library-modify",
	"user-library-read",
	"playlist-read-private",
	"playlist-modify-private",
];

const extraFields = [
	"username",
	"ip_addr_decrypted",
	"user_agent_decrypted",
	"episode_name",
	"episode_show_name",
	"spotify_episode_uri",
	"offline_timestamp",
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
	res.send(data);
});

// https://medium.com/@theyograjthakur/simplifying-large-file-uploads-with-react-and-node-js-a-step-by-step-guide-bd72967f57fe
const mergeChunks = async (fileName, totalChunks, userID) => {
	const chunkDir = __dirname + "/chunks";

	let chunkBuffs = [];
	for (let i = 0; i < totalChunks; i++) {
		const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
		chunkBuffs.push(fs.promises.readFile(chunkFilePath));
	}

	const fileJSON = Promise.all(chunkBuffs)
		.then((chunks) => new Blob(chunks))
		.then((fullFile) =>
			fullFile.text().then((text) => {
				let json = JSON.parse(text);

				json.forEach((item) => {
					extraFields.forEach((key) => {
						delete item[key];
					});

					item["user"] = userID;
				});
			})
		)
		.catch((err) => console.error(err));

	for (let i = 0; i < totalChunks; i++) {
		const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
		fs.unlink(chunkFilePath, (err) => err && console.error(err));
	}

	console.log("Chunks merged successfully");
};

router.post("/upload", upload.single("chunk"), async (req, res) => {
	const chunk = req.file.buffer;
	const chunkNum = Number(req.body.chunkNum);
	const fileNum = req.body.fileNum;
	const totalChunks = Number(req.body.totalChunks);
	const userID = req.body.userID;
	const fileName = userID + fileNum;

	const chunkDir = __dirname + "/chunks";

	if (!fs.existsSync(chunkDir)) {
		fs.mkdirSync(chunkDir);
	}

	const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNum}`;

	try {
		await fs.promises.writeFile(
			chunkFilePath,
			chunk,
			(err) => err && console.error(err)
		);
		console.log(`Chunk ${chunkNum}/${totalChunks} saved`);

		if (chunkNum === totalChunks - 1) {
			await mergeChunks(fileName, totalChunks, userID);
			console.log("File merged successfully");
		}

		res
			.status(200)
			.send("Chunk " + (chunkNum + 1) + " of " + totalChunks + " received");
	} catch (error) {
		console.error("Error saving chunk:", error);
		res
			.status(500)
			.send("Error saving chunk " + (chunkNum + 1) + " of " + totalChunks);
	}
});

export default router;
