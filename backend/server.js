import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { spotifyRouter } from "./routes/spotify_api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

if (process.env.NODE_ENV === "development") {
	app.use(
		cors({
			origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
			credentials: true,
		})
	);
}

app.use("/spotify/", spotifyRouter);

app.use(express.static(path.join(__dirname, "../client/build")));

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
