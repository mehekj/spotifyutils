import express from "express";
import db from "./conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  let collection = await db.collection("users");
  let result = await collection.find({}).toArray();
  res.send(JSON.stringify(result)).status(200);
});

router.post("/", async (req, res) => {
  let collection = await db.collection("users");
  let result = await collection.insertOne(req.body);
  res.send(result).status(204);
});

export default router;
