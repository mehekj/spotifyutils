import { logDebug, logError } from "../utils/logger.js";
import { MongoAPIError } from "../utils/mongo.js";
import { getSpotifyItemId } from "../utils/spotify.js";
import { tracks } from "./conn.js";

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
		logDebug("mongo", "track stub operations complete", {
			inserted: result.upsertedCount,
			matched: result.matchedCount,
			modified: result.modifiedCount,
		});
	} catch (error) {
		throw new MongoAPIError("Failed to insert track stubs", 500, error);
	}
};

export const createTrackStub = async (trackUri, metadata = {}) => {
	try {
		const existingTrack = await tracks.findOne({ _id: trackUri });
		if (existingTrack) {
			return existingTrack;
		}

		const stub = createTrackStubDocument(trackUri, metadata);
		await tracks.insertOne(stub);
		logDebug("mongo", "created track stub", { trackUri });
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
		logDebug("mongo", "enriched track metadata", { trackUri });
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
		return existingTrack;
	}

	if (pendingTrackEnrichments.has(trackUri)) {
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

			logDebug("mongo", "fetching Spotify metadata for track", { trackUri });
			const spotifyTrack = await spotifyGet(req, res, `/tracks/${trackUri}`);
			return updateTrackFromSpotify(trackUri, spotifyTrack);
		} catch (error) {
			logError("mongo", "failed to enrich track metadata", error, { trackUri });
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
