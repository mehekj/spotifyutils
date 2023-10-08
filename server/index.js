import cors from "cors";
import express from "express";
import "./loadEnvironment.js";
import router from "./routes.js";
import { config } from "./constants.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/", router);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
