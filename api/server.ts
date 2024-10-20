import { Context, Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { cache } from "hono/cache";
import { etag } from "hono/etag";
import { validator } from "hono/validator";
import mongoose from "mongoose";
import Data from "./data";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

// 中间件
app.use("*", cors());
app.use("*", compress());
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("*", etag());

// 数据库连接
mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Connection failed:", err));

// 错误处理函数
const handleError = (c: Context, err: Error) => {
  console.error("Operation failed:", err);
  return c.json({ success: false, error: err.message }, 500);
};

// 路由
app.get(
  "/api/getMemo",
  cache({
    cacheName: "memos-cache",
    cacheControl: "max-age=60", // 缓存 60 秒
  }),
  async (c) => {
    try {
      const { message, userId } = c.req.query();
      const keyWords = {
        message: { $regex: message || "", $options: "i" },
        userId: userId,
      };
      const data = await Data.find(keyWords).sort({ createdAt: -1 });
      return c.json({ success: true, data });
    } catch (err) {
      return handleError(c, err as Error);
    }
  }
);

app.post(
  "/api/putMemo",
  validator("json", (value, c) => {
    const { message, userId } = value;
    if (
      !message ||
      typeof message !== "string" ||
      !userId ||
      typeof userId !== "string"
    ) {
      return c.json({ success: false, error: "无效的输入" }, 400);
    }
    return { message, userId };
  }),
  async (c) => {
    try {
      const { message, userId } = c.req.valid("json");
      const newMemo = new Data({ message, userId });
      await newMemo.save();
      return c.json({ success: true, data: newMemo });
    } catch (err) {
      return handleError(c, err as Error);
    }
  }
);

app.patch(
  "/api/updateMemo",
  validator("json", (value, c) => {
    const { _id, message, userId } = value;
    if (
      !_id ||
      typeof _id !== "string" ||
      !message ||
      message === "<p><br></p>" ||
      typeof message !== "string" ||
      !userId ||
      typeof userId !== "string"
    ) {
      return c.json({ success: false, error: "无效的输入" }, 400);
    }
    return { _id, message, userId };
  }),
  async (c) => {
    try {
      const { _id, message, userId } = c.req.valid("json");
      const updatedMemo = await Data.findOneAndUpdate(
        { _id, userId },
        { message },
        { new: true }
      );
      if (!updatedMemo) {
        return c.json({ success: false, error: "未找到指定的 memo" }, 404);
      }
      return c.json({ success: true, data: updatedMemo });
    } catch (err) {
      return handleError(c, err as Error);
    }
  }
);

app.delete("/api/deleteMemo/:_id", async (c) => {
  try {
    const _id = c.req.param("_id");
    const userId = c.req.query("userId");

    if (!_id || !userId) {
      return c.json({ success: false, error: "缺少必要的参数" }, 400);
    }

    const deletedMemo = await Data.findOneAndDelete({
      _id,
      userId,
    });

    if (!deletedMemo) {
      return c.json({ success: false, error: "未找到指定的 memo" }, 404);
    }

    return c.json({ success: true, data: deletedMemo });
  } catch (err) {
    return handleError(c, err as Error);
  }
});

// 服务器启动
const port = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "production") {
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port: port as number,
  });
}

export default app;
