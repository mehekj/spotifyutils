import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { authRouter } from "./routes/auth.js";
import { spotifyRouter } from "./routes/spotify.js";
import { MongoAPIError } from "mongodb";
import { SpotifyAPIError } from "./middleware/spotify.js";
import { dataRouter } from "./routes/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use((err, req, res, next) => {
	if (err instanceof SpotifyAPIError) {
		console.error("Spotify request error:", err);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	if (err instanceof MongoAPIError) {
		console.error("MongoDB request error:", err);
		return res.status(err.status || 500).json({
			message: err.message,
			details: err.details,
		});
	}

	console.error("Unhandled error:", err);
	res.status(500).json({ message: "Internal server error" });
});

app.use("/auth/", authRouter);
app.use("/spotify/", spotifyRouter);
app.use("/data/", dataRouter);

app.use(express.static(path.join(__dirname, "../client/build")));

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
