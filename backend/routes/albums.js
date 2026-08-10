import express from "express";
import { attachSpotifyUser, requireSpotifyAuth } from "../utils/auth.js";
import { logDebug } from "../utils/logger.js";
import { getAlbumStreams } from "../db/streams.js";
import { spotifyGet } from "../utils/spotify.js";
import { getAlbumInfo } from "../db/albums.js";
import { getArtistInfo } from "../db/artists.js";

export const albumsRouter = express.Router();

albumsRouter.use(requireSpotifyAuth, attachSpotifyUser);

albumsRouter.get("/:uri/info", async (req, res, next) => {
	logDebug("albums", "fetching album info", {
		userId: req.user.id,
		albumUri: req.params.uri,
	});

	try {
		const albumInfo = await getAlbumInfo(req.params.uri);
		const artists = await Promise.all(
			albumInfo.artistURIs.map((artistURI) => getArtistInfo(artistURI)),
		);
		const artistNames = artists.map((artist) => artist.name);
		albumInfo.artistNames = artistNames;
		res.json(albumInfo);
	} catch (err) {
		next(err);
	}
});

albumsRouter.get("/:uri/streams", async (req, res, next) => {
	logDebug("albums", "fetching album streams", {
		userId: req.user.id,
		albumUri: req.params.uri,
	});

	try {
		const streams = await getAlbumStreams(req.user.id, req.params.uri);
		res.json(streams);
	} catch (err) {
		next(err);
	}
});
