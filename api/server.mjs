import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { etag } from "hono/etag";
import { validator } from "hono/validator";
import { handle } from "hono/vercel";
import mongoose from "mongoose";
import Data from "./data.mjs";
import { config } from "dotenv";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV !== "production") {
  config();
}

const app = new Hono();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const baseUri = process.env.MONGODB_URI || "";
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 5000,
      family: 4,
    };

    await mongoose.connect(baseUri, options);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false;
    throw error;
  }
};

// 初始化数据库连接
const initDB = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      await connectDB();
      break;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === 2) {
        console.error("All connection attempts failed");
      } else {
        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
};

// 立即执行初始化
initDB();

// 中间件确保数据库连接
app.use("*", async (c, next) => {
  if (!isConnected) {
    try {
      await connectDB();
    } catch (error) {
      return c.json(
        {
          success: false,
          message: "Database connection failed",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        },
        503
      );
    }
  }
  await next();
});

// 修改请求头适配中间件
app.use("*", async (c, next) => {
  const originalRequest = c.req.raw;
  if (
    originalRequest &&
    !originalRequest.headers.get &&
    originalRequest.headers
  ) {
    const headers = originalRequest.headers;
    Object.defineProperty(headers, "get", {
      value: function (name) {
        return this[name.toLowerCase()] || null;
      },
      writable: true,
      configurable: true,
    });
  }
  await next();
});

// CORS 中间件
app.use("*", async (c, next) => {
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  await next();
});

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("*", etag());

// 错误处理
const handleError = (c, err) => {
  console.error("Operation failed:", err);
  return c.json(
    {
      success: false,
      error: err.message,
    },
    500
  );
};

// API 路由优化 - 移除重复的连接检查
app.get("/api/getMemo", async (c) => {
  const startTime = Date.now();

  try {
    const { message, userId } = c.req.query();

    // 验证必需参数
    if (!userId) {
      return c.json(
        {
          success: false,
          message: "userId is required",
        },
        400
      );
    }

    const query = {};
    if (message) query.message = { $regex: message, $options: "i" };
    if (userId) query.userId = userId;

    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Query timeout")), 25000);
    });

    // 执行查询
    const queryPromise = Data.find(query)
      .select("message userId createdAt")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
      .exec();

    // 使用 Promise.race 确保查询不会超时
    const data = await Promise.race([queryPromise, timeoutPromise]);

    // 添加响应时间指标
    const duration = Date.now() - startTime;

    return c.json({
      success: true,
      data,
      metrics: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("API Error:", {
      error: err.message,
      duration,
      timestamp: new Date().toISOString(),
    });

    // 根据错误类型返回适当的状态码
    if (err.message === "Query timeout") {
      return c.json(
        {
          success: false,
          message: "请求超时，请稍后重试",
          metrics: { duration },
        },
        504
      );
    }

    return c.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development" ? err.message : "服务器错误",
        metrics: { duration },
      },
      500
    );
  }
});

app.post(
  "/api/putMemo",
  validator("json", (value, c) => {
    const { message, userId } = value;
    if (!message || !userId) {
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
      return handleError(c, err);
    }
  }
);

app.patch(
  "/api/updateMemo",
  validator("json", (value, c) => {
    const { _id, message, userId } = value;
    if (!_id || !message || message === "<p><br></p>" || !userId) {
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
      return handleError(c, err);
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

    const deletedMemo = await Data.findOneAndDelete({ _id, userId });
    if (!deletedMemo) {
      return c.json({ success: false, error: "未找到指定的 memo" }, 404);
    }

    return c.json({ success: true, data: deletedMemo });
  } catch (err) {
    return handleError(c, err);
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 添加静态文件服务
app.use("/*", serveStatic({ root: "./dist" }));

const port = process.env.PORT || 3001;

// 生产环境和开发环境都使用相同的服务器配置
serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on port ${port}`);

export default handle(app);
