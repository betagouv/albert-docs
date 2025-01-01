import express from "express";
import { runQuery } from "./runQuery";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const q = req.query.q?.toString();
  const collections = req.query.collections?.toString().split(",") || [];
  console.log("q", q);
  console.log("collections", collections);
  if (q && collections.length) {
    runQuery(q, collections)
      .then((r) => {
        res.json(r);
      })
      .catch(() => {
        res.status(500).send("Error");
      });
    return;
  }
  res.status(404).send("Not found");
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
