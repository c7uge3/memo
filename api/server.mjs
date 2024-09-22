import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import compression from "compression";
import bodyParser from "body-parser";
import logger from "morgan";
import Data from "./data.mjs";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const PORT = process.env.PORT || 3037;
const app = express();
app.use(cors());
app.use(compression());
const router = express.Router();
dotenv.config();
const dbRoute = process.env.MONGODB_URI;

// 连接到 MongoDB 数据库
mongoose
  .connect(dbRoute, {})
  .then(() => console.log("Connected to database!"))
  .catch((err) => console.error(err));

// 用于记录和 bodyParser，
// 将请求体解析为可读的 json 格式
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger("dev"));

// 错误处理函数
const handleError = (res, err) => {
  console.error("操作失败：", err);
  res.status(500).json({ success: false, error: err.message });
};

// get 方法
// 获取数据库中的所有可用数据
router.get("/getMemo", async (req, res) => {
  try {
    const { message } = req.query;
    const keyWords = { message: { $regex: message || "", $options: "i" } };
    const data = await Data.find(keyWords).sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

// 更新方法
// 会覆盖数据库中的现有数据
router.post("/updateMemo", async (req, res) => {
  try {
    const { id, update } = req.body;
    await Data.findByIdAndUpdate(id, update);
    return res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

// 删除方法
// 删除数据库中的现有数据
router.delete("/deleteMemo", async (req, res) => {
  try {
    const { id } = req.body;
    await Data.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

// 创造方法
// 在数据库中添加新数据
router.post("/putMemo", async (req, res) => {
  try {
    const { message, tags } = req.body;
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
    handleError(res, err);
  }
});

// 使用 helmet 增加安全性
app.use(helmet());

// 添加请求限制以防止 DoS 攻击
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 15 分钟内最多 100 个请求
});
app.use(limiter);

// 为 http 请求添加 /api
app.use("/api", router);

// 监听
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
