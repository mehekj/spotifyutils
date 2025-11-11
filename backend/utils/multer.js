import fs from "fs";
import { insertStreams } from "./mongo.js";

const __dirname = "/tmp";

const extraFields = [
	"username",
	"ip_addr_decrypted",
	"user_agent_decrypted",
	"episode_name",
	"episode_show_name",
	"spotify_episode_uri",
	"offline_timestamp",
];

export class MulterAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "MulterAPIError";
		this.status = status;
		this.details = details;
	}
}

const mergeAndStoreChunks = async (
	fileName,
	totalChunks,
	chunkDir,
	userID,
	uploadTime
) => {
	try {
		let chunkBuffs = [];
		for (let i = 0; i < totalChunks; i++) {
			const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
			chunkBuffs.push(fs.promises.readFile(chunkFilePath));
		}

		const chunks = await Promise.all(chunkBuffs);
		const fullFile = await new Blob(chunks);
		const text = await fullFile.text();

		let json = JSON.parse(text);
		json.forEach((item) => {
			extraFields.forEach((key) => {
				delete item[key];
			});

			item["user"] = userID;
			item["uploadTime"] = uploadTime;
		});

		await insertStreams(json);

		// for (let i = 0; i < totalChunks; i++) {
		// 	const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
		// 	fs.unlink(chunkFilePath);
		// }
	} catch (err) {
		throw new MulterAPIError("Failed to merge and store file chunks", 500, err);
	}
};

export const uploadChunk = async (
	chunk,
	chunkNum,
	totalChunks,
	fileNum,
	userID,
	uploadTime
) => {
	try {
		const fileName = userID + uploadTime + fileNum;
		const chunkDir = __dirname + "/chunks";
		const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNum}`;

		if (!fs.existsSync(chunkDir)) {
			fs.mkdirSync(chunkDir);
		}

		await fs.promises.writeFile(chunkFilePath, chunk);
		console.log(
			`Chunk ${chunkNum}/${totalChunks} saved for user ${userID} upload at time ${new Date(
				uploadTime
			)}`
		);

		if (chunkNum === totalChunks - 1) {
			await mergeAndStoreChunks(
				fileName,
				totalChunks,
				chunkDir,
				userID,
				uploadTime
			);
			console.log(`File ${fileName} merged and stored successfully`);
		}
	} catch (err) {
		throw new MulterAPIError(
			`Failed to upload chunk ${chunkNum + 1} of ${totalChunks}`,
			500,
			err
		);
	}
};
