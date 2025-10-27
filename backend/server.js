import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.static(path.join(__dirname, "../client/public")));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
