import cors from "cors";
import express from "express";
import "./loadEnvironment.js";
import router from "./routes.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://localhost:3000",
			"http://spotifyutils.mehekjethani.com",
			"https://spotifyutils.mehekjethani.com",
			"http://www.spotifyutils.mehekjethani.com",
			"https://www.spotifyutils.mehekjethani.com",
		],
	})
);
app.use(express.json());

app.use("/", router);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
