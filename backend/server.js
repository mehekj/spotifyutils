import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { albumsRouter } from "./routes/albums.js";
import { artistsRouter } from "./routes/artists.js";
import { authRouter } from "./routes/auth.js";
import { tracksRouter } from "./routes/tracks.js";
import { usersRouter } from "./routes/users.js";
import { MongoAPIError } from "./utils/mongo.js";
import { SpotifyAPIError } from "./utils/spotify.js";

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
		console.error("Spotify request error:", {
			message: err.message,
			details: err.details,
			stack: err.stack,
			error: err,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof MongoAPIError) {
		console.error("MongoDB request error:", {
			message: err.message,
			details: err.details,
			stack: err.stack,
			error: err,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof FilesAPIError) {
		console.error("Files request error:", {
			message: err.message,
			details: err.details,
			stack: err.stack,
			error: err,
		});
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	console.error("Unhandled error:", {
		message: err.message,
		stack: err.stack,
		error: err,
	});
	res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
