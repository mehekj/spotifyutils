import fs from "fs";
import os from "os";
import path from "path";
import { insertStreams } from "../db/streams.js";
import { insertTrackStubs } from "../db/tracks.js";
import { logError } from "./logger.js";
import { isValidSpotifyTrackUri } from "./spotify.js";

const CHUNK_DIR = `${os.tmpdir()}/chunks`;
const MAX_CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const CHUNK_RETENTION_MS = 24 * 60 * 60 * 1000;

const hasTrackInfo = (record) => {
	return isValidSpotifyTrackUri(record.spotify_track_uri);
};

const sanitizeRecord = (record) => {
	const sanitized = {};
	const allowedFields = [
		"ts",
		"platform",
		"ms_played",
		"conn_country",
		"ip_addr",
		"master_metadata_track_name",
		"master_metadata_album_artist_name",
		"master_metadata_album_album_name",
		"spotify_track_uri",
		"reason_start",
		"reason_end",
		"shuffle",
		"skipped",
		"offline",
		"offline_timestamp",
		"incognito_mode",
	];

	for (const field of allowedFields) {
		if (field in record) {
			const value = record[field];
			if (typeof value === "string") {
				sanitized[field] = value.slice(0, 1000);
			} else {
				sanitized[field] = value;
			}
		}
	}

	return sanitized;
};

const cleanupOldChunks = async () => {
	try {
		const files = await fs.promises.readdir(CHUNK_DIR, { withFileTypes: true });
		const now = Date.now();

		for (const file of files) {
			const filePath = path.join(CHUNK_DIR, file.name);
			const stats = await fs.promises.stat(filePath);
			const age = now - stats.mtimeMs;

			if (age > CHUNK_RETENTION_MS) {
				await fs.promises.rm(filePath);
			}
		}
	} catch (err) {
		logError("files", "Failed to cleanup old chunks", err);
	}
};

const cleanupChunksForFile = async (fileName, totalChunks) => {
	try {
		const rmPromises = [];
		for (let i = 0; i < totalChunks; i++) {
			rmPromises.push(
				fs.promises.rm(`${CHUNK_DIR}/${fileName}.part_${i}`, { force: true }),
			);
		}
		await Promise.all(rmPromises);
	} catch (err) {
		logError("files", `Failed to cleanup chunks`, err, {
			fileName,
			totalChunks,
		});
	}
};

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
	uploadTime,
) => {
	try {
		const chunkPromises = Array.from({ length: totalChunks }, (_, i) =>
			fs.promises.readFile(`${CHUNK_DIR}/${fileName}.part_${i}`),
		);

		const buffers = await Promise.all(chunkPromises);
		const buffer = Buffer.concat(buffers);

		if (buffer.length > MAX_FILE_SIZE) {
			throw new FilesAPIError("Total file size exceeds 500MB limit", 400);
		}

		let json;
		try {
			json = JSON.parse(buffer.toString("utf8"));
		} catch (err) {
			throw new FilesAPIError("Invalid JSON format", 400, err.message);
		}

		if (!Array.isArray(json)) {
			throw new FilesAPIError("JSON must be an array", 400);
		}

		const validRecords = json.filter(hasTrackInfo).map((item) => {
			const sanitized = sanitizeRecord(item);
			sanitized.user = userID;
			sanitized.uploadTime = uploadTime;
			return sanitized;
		});

		if (validRecords.length > 0) {
			await Promise.all([
				insertTrackStubs(validRecords),
				insertStreams(validRecords),
			]);
		}

		await cleanupChunksForFile(fileName, totalChunks);
	} catch (err) {
		await cleanupChunksForFile(fileName, totalChunks);
		throw err;
	}
};

export const uploadChunk = async (
	chunk,
	chunkNum,
	totalChunks,
	fileNum,
	userID,
	uploadTime,
) => {
	try {
		if (!Buffer.isBuffer(chunk)) {
			throw new FilesAPIError("Invalid chunk format", 400);
		}

		if (chunk.length > MAX_CHUNK_SIZE) {
			throw new FilesAPIError(
				`Chunk size exceeds ${MAX_CHUNK_SIZE / 1024 / 1024}MB limit`,
				400,
			);
		}

		if (chunkNum < 0 || chunkNum >= totalChunks || totalChunks <= 0) {
			throw new FilesAPIError("Invalid chunk parameters", 400);
		}

		if (!userID || typeof userID !== "string") {
			throw new FilesAPIError("Invalid user ID", 400);
		}

		await fs.promises.mkdir(CHUNK_DIR, { recursive: true });

		const fileName = `${userID}_${uploadTime}_${fileNum}`;
		const chunkFilePath = path.join(CHUNK_DIR, `${fileName}.part_${chunkNum}`);
		await fs.promises.writeFile(chunkFilePath, chunk);

		if (chunkNum === 0) {
			cleanupOldChunks();
		}

		if (chunkNum === totalChunks - 1) {
			await mergeAndStoreChunks(fileName, totalChunks, userID, uploadTime);
		}
	} catch (err) {
		throw err;
	}
};
