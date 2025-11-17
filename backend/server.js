import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { MongoAPIError } from "./utils/mongo.js";
import { SpotifyAPIError } from "./utils/spotify.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { tracksRouter } from "./routes/tracks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use((err, req, res, next) => {
	if (err instanceof SpotifyAPIError) {
		console.error("Spotify request error:", err.details);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof MongoAPIError) {
		console.error("MongoDB request error:", err.details);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof FilesAPIError) {
		console.error("Files request error:", err.details);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

app.use("/auth/", authRouter);
app.use("/users/", usersRouter);
app.use("/tracks/", tracksRouter);

const buildPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(buildPath));

app.get(/.*/, (req, res) => {
	res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
