import cors from "cors";
import express from "express";
import "./loadEnvironment.js";
import records from "./routes.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/", records);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
