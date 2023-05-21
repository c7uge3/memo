"use strict";

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const compression = require("compression"); // gzip
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

const port = "3017";
const app = express();
app.use(cors());
app.use(compression());
const router = express.Router();

// MongoDB 数据库
const dbRoute =
  "mongodb+srv://vercel-admin-user-64662ac8365ca81155b8c6fa:Wbsqxu2EPngggzPj@cluster0.q16db.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose
  .connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to database!"))
  .catch((err) => console.error(err));

// 用于记录和 bodyParser，
// 将请求体解析为可读的 json 格式
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger("dev"));

// get 方法
// 获取数据库中的所有可用数据
router.get("/getMemo", async (req, res) => {
  try {
    const { message } = req.query;
    const keyWords = { message: { $regex: message ? message : /[\s\S]/ } }; // “[\s\S]”才会匹配任意字符，而不是“*”
    const data = await Data.find(keyWords).sort({ createdAt: -1 });
    return res.json({ success: true, data: data });
  } catch (err) {
    return res.json({ success: false, error: err });
  }
});

// 更新方法（暂未使用）
// 会覆盖数据库中的现有数据
router.post("/updateMemo", async (req, res) => {
  try {
    const { id, update } = req.body;
    await Data.findByIdAndUpdate(id, update);
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err });
  }
});

// 删除方法
// 删除数据库中的现有数据
router.delete("/deleteMemo", async (req, res) => {
  try {
    const { id } = req.body;
    await Data.findByIdAndRemove(id);
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err });
  }
});

// 创造方法
// 在数据库中添加新数据
router.post("/putMemo", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({
        success: false,
        error: "INVALID INPUTS",
      });
    }
    const data = new Data({ message });
    await data.save();
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err });
  }
});

// 为 http 请求添加 /api
app.use("/api", router);

// 将 API 请求发送到端口
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
