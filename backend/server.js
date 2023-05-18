const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const compression = require("compression"); // gzip
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

const port = process.env.API_PORT || "3001";
const app = express();
app.use(cors());
app.use(compression());
const router = express.Router();

// MongoDB 数据库
const dbRoute =
  "mongodb://pkrk_3721:qjr5gEJcAxB4SQVk@cluster0-shard-00-00.q16db.mongodb.net:27017,cluster0-shard-00-01.q16db.mongodb.net:27017,cluster0-shard-00-02.q16db.mongodb.net:27017/Cluster0?ssl=true&replicaSet=atlas-7ijfj5-shard-0&authSource=admin&retryWrites=true&w=majority";

// 将后端代码与数据库连接起来
mongoose.connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// 检查与数据库的连接是否成功
db.on("error", console.error.bind(console, "MongoDB connection error:"));

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
