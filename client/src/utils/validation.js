const VALID_FIELDS = [
	"ts",
	"platform",
	"ms_played",
	"conn_country",
	"ip_addr",
	"master_metadata_track_name",
	"master_metadata_album_artist_name",
	"master_metadata_album_album_name",
	"spotify_track_uri",
	"episode_name",
	"episode_show_name",
	"spotify_episode_uri",
	"audiobook_title",
	"audiobook_uri",
	"audiobook_chapter_uri",
	"audiobook_chapter_title",
	"reason_start",
	"reason_end",
	"shuffle",
	"skipped",
	"offline",
	"offline_timestamp",
	"incognito_mode",
];

export class ValidationError extends Error {
	constructor(message, details = null) {
		super(message);
		this.name = "ValidationError";
		this.details = details;
	}
}

export const validateJsonFile = async (file) => {
	try {
		const text = await file.text();

		if (!text || text.trim().length === 0) {
			throw new ValidationError("File is empty");
		}

		const data = JSON.parse(text);

		if (!Array.isArray(data)) {
			throw new ValidationError("JSON must be an array of streaming records");
		}

		if (data.length === 0) {
			throw new ValidationError("JSON array is empty");
		}

		return data;
	} catch (err) {
		if (err instanceof ValidationError) {
			throw err;
		}
		throw new ValidationError("Invalid JSON format", err.message);
	}
};

export const hasTrackInfo = (record) => {
	return (
		(record.master_metadata_track_name || record.spotify_track_uri) &&
		record.master_metadata_album_artist_name
	);
};

export const validateRecord = (record, recordIndex) => {
	if (!record || typeof record !== "object") {
		throw new ValidationError(`Record ${recordIndex} is not a valid object`);
	}

	if (!hasTrackInfo(record)) {
		return;
	}

	if (record.ms_played !== undefined && typeof record.ms_played !== "number") {
		throw new ValidationError(
			`Record ${recordIndex} ms_played must be a number`,
		);
	}

	if (record.ts !== undefined && typeof record.ts !== "string") {
		throw new ValidationError(
			`Record ${recordIndex} ts (timestamp) must be a string`,
		);
	}

	if (record.ms_played < 0) {
		throw new ValidationError(
			`Record ${recordIndex}: ms_played cannot be negative`,
		);
	}

	if (
		record.master_metadata_track_name &&
		record.master_metadata_track_name.length > 500
	) {
		throw new ValidationError(
			`Record ${recordIndex}: Track name is suspiciously long`,
		);
	}

	if (
		record.master_metadata_album_artist_name &&
		record.master_metadata_album_artist_name.length > 500
	) {
		throw new ValidationError(
			`Record ${recordIndex}: Artist name is suspiciously long`,
		);
	}
};

export const validateAllRecords = (data, maxRecords = 100) => {
	const recordsToCheck =
		maxRecords > 0 ? Math.min(data.length, maxRecords) : data.length;

	for (let i = 0; i < recordsToCheck; i++) {
		validateRecord(data[i], i);
	}

	if (data.length > 100000) {
		console.warn(`Large file detected: ${data.length} records`);
	}
};

export const getDataSummary = (data, filteredCount = 0) => {
	if (!Array.isArray(data) || data.length === 0) {
		return null;
	}

	const firstRecord = data[0];
	const fieldsFound = Object.keys(firstRecord);
	const expectedFieldsFound = fieldsFound.filter((f) =>
		VALID_FIELDS.includes(f),
	);
	const unexpectedFields = fieldsFound.filter((f) => !VALID_FIELDS.includes(f));

	return {
		totalRecords: data.length,
		filteredRecords: filteredCount,
		fieldsFound: fieldsFound.length,
		expectedFieldsFound: expectedFieldsFound.length,
		unexpectedFields: unexpectedFields,
		hasSpotifyURI: data.some((r) => r.spotify_track_uri),
		hasTrackNames: data.some((r) => r.master_metadata_track_name),
		dateRange: {
			earliest: Math.min(
				...data
					.map((r) => {
						try {
							return new Date(r.ts).getTime();
						} catch {
							return Infinity;
						}
					})
					.filter((t) => isFinite(t)),
			),
			latest: Math.max(
				...data
					.map((r) => {
						try {
							return new Date(r.ts).getTime();
						} catch {
							return -Infinity;
						}
					})
					.filter((t) => isFinite(t)),
			),
		},
	};
};

export const validateFile = async (file, options = {}) => {
	const { checkAllRecords = false, maxSampleRecords = 100 } = options;

	try {
		let data = await validateJsonFile(file);

		const originalCount = data.length;
		data = data.filter((record) => hasTrackInfo(record));
		const filteredCount = originalCount - data.length;

		if (data.length === 0) {
			throw new ValidationError(
				"No valid track records found (all records are missing track or artist information)",
			);
		}

		if (checkAllRecords) {
			validateAllRecords(data);
		} else {
			validateAllRecords(data, maxSampleRecords);
		}

		const summary = getDataSummary(data, filteredCount);

		return {
			valid: true,
			data,
			summary,
			fileName: file.name,
			filteredCount,
		};
	} catch (err) {
		return {
			valid: false,
			error: err.message,
			details: err.details || null,
			fileName: file.name,
		};
	}
};

export const validateFiles = async (files, options = {}) => {
	const results = await Promise.all(
		Array.from(files).map((file) => validateFile(file, options)),
	);
	return results;
};
