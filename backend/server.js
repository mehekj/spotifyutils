import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { albumsRouter } from "./routes/albums.js";
import { artistsRouter } from "./routes/artists.js";
import { authRouter } from "./routes/auth.js";
import { tracksRouter } from "./routes/tracks.js";
import { usersRouter } from "./routes/users.js";
import { FilesAPIError } from "./utils/files.js";
import { logDebug, logError } from "./utils/logger.js";
import { MongoAPIError } from "./utils/mongo.js";
import { SpotifyAPIError } from "./utils/spotify.js";

import "./db/conn.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use("/auth/", authRouter);
app.use("/users/", usersRouter);
app.use("/tracks/", tracksRouter);
app.use("/artists/", artistsRouter);
app.use("/albums", albumsRouter);

const buildPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

app.get(/.*/, (req, res) => {
	res.sendFile(path.join(buildPath, "index.html"));
});

app.use((err, req, res, next) => {
	if (err instanceof SpotifyAPIError) {
		logError("spotify", "Spotify request error", err, {
			userId: req.user?.id,
			endpoint: req.originalUrl,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof MongoAPIError) {
		logError("mongo", "MongoDB request error", err, {
			userId: req.user?.id,
			endpoint: req.originalUrl,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof FilesAPIError) {
		logError("files", "Files request error", err, {
			userId: req.user?.id,
			endpoint: req.originalUrl,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	logError("server", "Unhandled error", err, {
		userId: req.user?.id,
		endpoint: req.originalUrl,
	});

	res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	logDebug("server", `Server is running on port ${PORT}`);
});
