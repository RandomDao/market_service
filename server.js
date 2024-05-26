import express from "express";
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt");
import bodyParser from "body-parser";
const dao = require("./dao.js");
const secretKey = "wlsx%dapp";

const app = express();
const port = 8080;

app.use(express.static("uploads"));
app.use(bodyParser.json());

app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

// app.use(
//   expressjwt({ secret: secretKey, algorithms: ["HS256"] }).unless({
//     path: [
//       "/api/user/signin",
//       "/api/admin/signin",
//       "/api/upload",
//       /^\/api\/public\/.*/,
//     ],
//   })
// );
const authenticateToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (token == null) return res.sendStatus(401);
  token = token.split(" ")[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/orders", async function (req, res) {
  console.log(JSON.stringify(req.query));
  let result = await dao.getOrders(
    req.query.category,
    req.query.projectId,
    req.query.status,
    req.query.page,
    req.query.pageSize
  );
  res.status(200).json({ code: 200, data: result, message: "ok" });
});

app.get("/api/desktop", async function (req, res) {
  console.log(JSON.stringify(req.query));
  let result = await dao.getDesktop();
  res.status(200).json({ code: 200, data: result, message: "ok" });
});

app.get("/api/projects/:id", async function (req, res) {
  console.log(JSON.stringify(req.query));
  let result = await dao.getDesktopDetail(req.params.id);
  let prices = result.map((item) => {
    return { price: item.price, time: item.updated_at };
  });
  let detail = await dao.getDesktop();

  let detail1 = detail.filter((item) => {
    if (item.project_id == req.params.id) {
      return item;
    }
  });
  //   let prices = result.map((item) => return {"price": item.price, "time": item.date}); // Add semicolon here
  res.status(200).json({
    code: 200,
    data: { "orders:": result, prices: prices, project: detail1[0] },
    message: "ok",
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
