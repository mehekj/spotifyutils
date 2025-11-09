import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "./environment.js";
import { authRouter } from "./routes/auth.js";
import { spotifyRouter } from "./routes/spotify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use("/auth/", authRouter);
app.use("/spotify/", spotifyRouter);

app.use(express.static(path.join(__dirname, "../client/build")));

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
