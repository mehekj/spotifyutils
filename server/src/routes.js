import express from "express";
import db from "./conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  res.send("test").status(200);
});

export default router;
