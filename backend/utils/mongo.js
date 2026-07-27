import { MongoClient } from "mongodb";
import { getSpotifyItemId, spotifyGet } from "./spotify.js";

const connectionString = process.env.MONGO_URI || "";

const client = new MongoClient(connectionString);

let conn;
try {
	conn = await client.connect();
} catch (err) {
	console.error(err);
}

let db = conn.db("decodify");
const users = db.collection("users");
const streams = db.collection("streams");
const tracks = db.collection("tracks");

export class MongoAPIError extends Error {
	constructor(message, status, details) {
		super(message);
		this.name = "MongoAPIError";
		this.status = status;
		this.details = details;
	}
}

export const getUserUpload = async (userID) => {
	try {
		const result = await users.findOne({ user: userID });
		if (result) {
			return result.uploadTime;
		} else {
			return null;
		}
	} catch (error) {
		throw new MongoAPIError("Failed to get user upload", 500, error);
	}
};

export const setUserUpload = async (userID, uploadTime) => {
	try {
		await users.updateOne(
			{ user: userID },
			{ $set: { user: userID, uploadTime: uploadTime } },
			{ upsert: true },
		);
	} catch (error) {
		throw new MongoAPIError("Failed to set user upload", 500, error);
	}
};

export const deleteStreams = async () => {
	try {
		await Promise.all([streams.deleteMany({}), tracks.deleteMany({})]);
		console.log("Deleted all stream and track documents");
	} catch (error) {
		throw new MongoAPIError("Failed to delete all streams", 500, error);
	}
};

export const deleteUserStreams = async (userID, uploadTime) => {
	try {
		await streams.deleteMany({ user: userID, uploadTime: { $ne: uploadTime } });
	} catch (error) {
		throw new MongoAPIError("Failed to delete user streams", 500, error);
	}
};

export const deleteUsers = async () => {
	try {
		await users.deleteMany({});
	} catch (error) {
		throw new MongoAPIError("Failed to delete users", 500, error);
	}
};

export const insertTrackStubs = async (data) => {
	try {
		const uniqueTracks = [
			...new Map(
				data
					.filter((entry) => getSpotifyItemId(entry?.spotify_track_uri))
					.map((entry) => [getSpotifyItemId(entry?.spotify_track_uri), entry]),
			).values(),
		];

		if (uniqueTracks.length === 0) {
			return;
		}

		const trackDocs = uniqueTracks.map((track) =>
			createTrackStubDocument(getSpotifyItemId(track.spotify_track_uri), {
				name: track.master_metadata_track_name,
				artists: track.master_metadata_album_artist_name
					.split(",")
					.map((artistName) => ({
						name: artistName.trim(),
						uri: null,
					})),
				album: { name: track.master_metadata_album_album_name, uri: null },
			}),
		);

		const result = await tracks.bulkWrite(
			trackDocs.map((doc) => ({
				updateOne: {
					filter: { _id: doc._id },
					update: {
						$setOnInsert: doc,
					},
					upsert: true,
				},
			})),
		);
		console.log(
			`Track stub operations complete, inserted: ${result.upsertedCount}, matched: ${result.matchedCount}, modified: ${result.modifiedCount}`,
		);
	} catch (error) {
		throw new MongoAPIError("Failed to insert track stubs", 500, error);
	}
};

export const insertStreams = async (data) => {
	try {
		const streamDocs = data.map(
			({
				master_metadata_track_name,
				master_metadata_album_artist_name,
				master_metadata_album_album_name,
				spotify_track_uri,
				...entry
			}) => ({
				spotify_track_uri: getSpotifyItemId(spotify_track_uri),
				...entry,
			}),
		);
		const result = await streams.insertMany(streamDocs, { ordered: false });
		console.log(`Inserted ${result.insertedCount} stream documents`);
	} catch (error) {
		throw new MongoAPIError("Failed to insert streams", 500, error);
	}
};

const createTrackStubDocument = (trackUri, metadata = {}) => {
	const artists = metadata.artists ?? [];
	return {
		_id: trackUri,
		name: metadata.name || null,
		artists,
		album: metadata.album || null,
		duration_ms: metadata.duration_ms || null,
		image: {
			small: metadata.images?.[2] || null,
			medium: metadata.images?.[1] || null,
			large: metadata.images?.[0] || null,
		},
		status: "stub",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
};

export const createTrackStub = async (trackUri, metadata = {}) => {
	try {
		const existingTrack = await tracks.findOne({ _id: trackUri });
		if (existingTrack) {
			return existingTrack;
		}

		const stub = createTrackStubDocument(trackUri, metadata);
		await tracks.insertOne(stub);
		console.log(`Inserted track stub for ${trackUri}`);
		return stub;
	} catch (error) {
		throw new MongoAPIError("Failed to create track stub", 500, error);
	}
};

export const getTrackByUri = async (trackUri) => {
	try {
		return await tracks.findOne({ _id: trackUri });
	} catch (error) {
		throw new MongoAPIError("Failed to get track", 500, error);
	}
};

export const updateTrackFromSpotify = async (trackUri, spotifyTrack) => {
	try {
		const artists = (spotifyTrack?.artists || []).map((artist) => ({
			name: artist?.name || null,
			uri: getSpotifyItemId(artist?.uri) || null,
		}));

		const updatedTrack = {
			_id: trackUri,
			name: spotifyTrack?.name || null,
			artists,
			album: {
				name: spotifyTrack?.album?.name || null,
				uri: getSpotifyItemId(spotifyTrack?.album?.uri) || null,
			},
			duration_ms: spotifyTrack?.duration_ms || null,
			image: {
				small: spotifyTrack?.album?.images?.[2] || null,
				medium: spotifyTrack?.album?.images?.[1] || null,
				large: spotifyTrack?.album?.images?.[0] || null,
			},
			status: "enriched",
			updatedAt: new Date(),
		};

		await tracks.updateOne(
			{ _id: trackUri },
			{ $set: updatedTrack },
			{ upsert: true },
		);
		console.log(`Enriched track metadata for ${trackUri}`);
		return updatedTrack;
	} catch (error) {
		throw new MongoAPIError("Failed to update track from Spotify", 500, error);
	}
};

const pendingTrackEnrichments = new Map();
export const getOrEnrichTrack = async (req, res, trackUri) => {
	if (!trackUri) {
		return null;
	}

	const existingTrack = await getTrackByUri(trackUri);
	if (existingTrack?.status === "enriched") {
		// console.log(`Track metadata already enriched for ${trackUri}`);
		return existingTrack;
	}

	if (pendingTrackEnrichments.has(trackUri)) {
		// console.log(`Track enrichment already in progress for ${trackUri}`);
		return pendingTrackEnrichments.get(trackUri);
	}

	const pendingPromise = (async () => {
		try {
			await createTrackStub(trackUri);

			if (!trackUri) {
				throw new SpotifyAPIError("Invalid Spotify track URI", 400, {
					trackUri,
				});
			}

			console.log(`Fetching Spotify metadata for track ${trackUri}`);
			const spotifyTrack = await spotifyGet(req, res, `/tracks/${trackUri}`);
			return updateTrackFromSpotify(trackUri, spotifyTrack);
		} catch (error) {
			console.error(`Failed to enrich track metadata for ${trackUri}`, error);
			throw error;
		}
	})();

	pendingTrackEnrichments.set(trackUri, pendingPromise);
	try {
		return await pendingPromise;
	} finally {
		pendingTrackEnrichments.delete(trackUri);
	}
};

export const getTopTracks = async (userID, limit = 20) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ $expr: { $gte: ["$ms_played", 30000] } },
						{ $expr: { $ne: ["$spotify_track_uri", null] } },
					],
				},
			},
			{
				$group: {
					_id: "$spotify_track_uri",
					spotify_track_uri: { $first: "$spotify_track_uri" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: limit },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError(`Failed to get top ${limit} tracks`, 500, error);
	}
};

export const getBottomTracks = async (userID, limit = 20) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [
						{ user: userID },
						{ $expr: { $gte: ["$ms_played", 30000] } },
						{ $expr: { $ne: ["$spotify_track_uri", null] } },
					],
				},
			},
			{
				$group: {
					_id: "$spotify_track_uri",
					spotify_track_uri: { $first: "$spotify_track_uri" },
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: 1 } },
			{ $limit: limit },
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError(`Failed to get bottom ${limit} tracks`, 500, error);
	}
};

export const getTrackStreams = async (userID, trackURI) => {
	try {
		const pipeline = [
			{
				$match: {
					$and: [{ user: userID }, { spotify_track_uri: trackURI }],
				},
			},
			{
				$sort: {
					ts: -1,
				},
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get track streams", 500, error);
	}
};

export const getArtistStreams = async (userID, artistUri) => {
	try {
		const pipeline = [
			{
				$match: {
					user: userID,
				},
			},
			{
				$lookup: {
					from: "tracks",
					let: { trackId: "$spotify_track_uri" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$_id", "$$trackId"] },
										{ $in: [artistUri, "$artists.uri"] },
									],
								},
							},
						},
					],
					as: "track",
				},
			},
			{
				$match: {
					track: { $ne: [] },
				},
			},
			{
				$set: {
					track: { $first: "$track" },
				},
			},

			{
				$sort: { ts: -1 },
			},
		];

		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get artist streams", 500, error);
	}
};

export const getAlbumStreams = async (userID, albumUri) => {
	try {
		console.log(`Fetching user ${userID}'s streams for album ${albumUri}`);
		const pipeline = [
			{
				$match: {
					user: userID,
				},
			},
			{
				$lookup: {
					from: "tracks",
					let: { trackId: "$spotify_track_uri" },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ["$_id", "$$trackId"] },
										{ $eq: ["$album.uri", albumUri] },
									],
								},
							},
						},
					],
					as: "track",
				},
			},
			{
				$match: {
					track: { $ne: [] },
				},
			},
			{
				$set: {
					track: { $first: "$track" },
				},
			},

			{
				$sort: { ts: -1 },
			},
		];
		const result = await streams.aggregate(pipeline).toArray();
		return result;
	} catch (error) {
		throw new MongoAPIError("Failed to get album streams", 500, error);
	}
};
