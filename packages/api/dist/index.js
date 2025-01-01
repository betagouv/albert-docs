import express from "express";
import { runQuery } from "./runQuery";
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
    var _a, _b;
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.toString();
    const collections = ((_b = req.query.collections) === null || _b === void 0 ? void 0 : _b.toString().split(",")) || [];
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
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=index.js.map