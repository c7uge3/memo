const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Data = require("./data");

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();

// MongoDB 数据库
const dbRoute =
  "mongodb+srv://pkrk_3721:qjr5gEJcAxB4SQVk@cluster0.q16db.mongodb.net/Cluster0?retryWrites=true&w=majority";

// 将后端代码与数据库连接起来
mongoose.connect(dbRoute, { useNewUrlParser: true });

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
router.get("/getData", (req, res) => {
  // res.send(req.params);
  const { message } = req.query;
  const keyWords = { message: { $regex: message ? message : /[\s\S]/ } }; // “[\s\S]”才会匹配任意字符，而不是“*”

  Data.find(keyWords, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  }).sort({ createdAt: -1 });
});

// 更新方法
// 会覆盖数据库中的现有数据
router.post("/updateData", (req, res) => {
  const { id, update } = req.body;
  Data.findByIdAndUpdate(id, update, (err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// 删除方法
// 删除数据库中的现有数据
router.delete("/deleteData", (req, res) => {
  const { id } = req.body;
  Data.findByIdAndRemove(id, (err) => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// 创造方法
// 在数据库中添加新数据
router.post("/putData", (req, res) => {
  let data = new Data();
  const { message } = req.body;
  // let createdAt  = moment(req.body.createdAt).tz("Asia/Shanghai").format('YYYY-MM-DD HH:mm:ss');

  if (!message) {
    return res.json({
      success: false,
      error: "INVALID INPUTS",
    });
  }

  data.message = message;
  data.save((err) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// 为 http 请求添加 /api
app.use("/api", router);

// 将后端发送到端口
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
