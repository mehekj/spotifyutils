import fs from "fs";
import os from "os";
import { insertStreams } from "./mongo.js";

const TMP_DIR = os.tmpdir();
const CHUNK_DIR = `${TMP_DIR}/chunks`;

const extraFields = [
	"username",
	"ip_addr_decrypted",
	"user_agent_decrypted",
	"episode_name",
	"episode_show_name",
	"spotify_episode_uri",
	"offline_timestamp",
];

export class FilesAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "FilesAPIError";
		this.status = status;
		this.details = details;
	}
}

const mergeAndStoreChunks = async (
	fileName,
	totalChunks,
	userID,
	uploadTime
) => {
	try {
		const chunkPromises = Array.from({ length: totalChunks }, (_, i) =>
			fs.promises.readFile(`${CHUNK_DIR}/${fileName}.part_${i}`)
		);

		const buffers = await Promise.all(chunkPromises);
		const buffer = Buffer.concat(buffers);

		const json = JSON.parse(buffer.toString("utf8"));

		for (const item of json) {
			for (const key of extraFields) delete item[key];
			item.user = userID;
			item.uploadTime = uploadTime;
		}

		await insertStreams(json);

		await Promise.all(
			Array.from({ length: totalChunks }, (_, i) =>
				fs.promises.rm(`${CHUNK_DIR}/${fileName}.part_${i}`)
			)
		);
	} catch (err) {
		throw err;
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
		if (chunkNum < 0 || chunkNum >= totalChunks) {
			throw new FilesAPIError("Invalid chunk index", 400);
		}

		await fs.promises.mkdir(CHUNK_DIR, { recursive: true });

		const fileName = `${userID}_${uploadTime}_${fileNum}`;
		const chunkFilePath = `${CHUNK_DIR}/${fileName}.part_${chunkNum}`;

		await fs.promises.writeFile(chunkFilePath, chunk);

		if (chunkNum === totalChunks - 1) {
			await mergeAndStoreChunks(fileName, totalChunks, userID, uploadTime);
		}
	} catch (err) {
		throw new FilesAPIError(
			`Failed to upload chunk ${chunkNum + 1} of ${totalChunks}`,
			500,
			err
		);
	}
};
