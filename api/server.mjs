/**
 * 数据库连接和初始化模块
 */

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

// 非生产环境加载环境变量
if (process.env.NODE_ENV !== "production") {
  config();
}

const app = new Hono();

let isConnected = false;

/**
 * 连接数据库
 * 包含重试和错误处理机制
 */
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

/**
 * 初始化数据库连接
 * 最多尝试3次连接，失败后等待2秒重试
 */
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
};

// 立即执行初始化
initDB();

/**
 * 中间件：确保数据库连接
 */
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

/**
 * 中间件：修改请求头适配
 */
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

/**
 * 中间件：CORS 配置
 */
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

// 应用通用中间件
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("*", etag());

/**
 * 统一错误处理函数
 * @param {Context} c - Hono 上下文
 * @param {Error} err - 错误对象
 */
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

/**
 * GET /api/getMemo - 获取备忘录列表
 * 支持分页、搜索和完整数据获取
 */
app.get("/api/getMemo", async (c) => {
  const startTime = Date.now();
  const TIMEOUT_MS = 20000;

  try {
    const {
      message,
      userId,
      page = 1,
      pageSize = 10,
      full = false,
    } = c.req.query();

    if (!userId) {
      return c.json(
        {
          success: false,
          message: "userId is required",
        },
        400
      );
    }

    // 构建查询条件
    const query = {};
    if (message) query.message = { $regex: message, $options: "i" };
    if (userId) query.userId = userId;

    // 设置查询超时
    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
    }, TIMEOUT_MS);

    try {
      // 获取总数
      const totalCount = await Data.countDocuments(query).maxTimeMS(TIMEOUT_MS);

      // 如果是第一页且请求全量数据
      if (page === "1" && full === "true") {
        const [pageData, fullData] = await Promise.all([
          Data.find(query)
            .select("message userId createdAt")
            .sort({ createdAt: -1 })
            .limit(parseInt(pageSize))
            .lean()
            .maxTimeMS(TIMEOUT_MS)
            .exec(),
          Data.find(query)
            .select("message userId createdAt")
            .sort({ createdAt: -1 })
            .lean()
            .maxTimeMS(TIMEOUT_MS)
            .exec(),
        ]);

        clearTimeout(timeoutId);

        if (isTimeout) {
          throw new Error("Query timeout");
        }

        return c.json({
          success: true,
          data: pageData,
          fullData,
          hasMore: pageSize < totalCount,
          totalCount,
          currentPage: 1,
          totalPages: Math.ceil(totalCount / pageSize),
          metrics: {
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 常规分页查询
      const currentPage = parseInt(page);
      const limit = parseInt(pageSize);
      const skip = (currentPage - 1) * limit;

      if (isNaN(currentPage) || currentPage < 1 || isNaN(limit) || limit < 1) {
        return c.json(
          {
            success: false,
            message: "Invalid pagination parameters",
          },
          400
        );
      }

      const data = await Data.find(query)
        .select("message userId createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(TIMEOUT_MS)
        .exec();

      clearTimeout(timeoutId);

      if (isTimeout) {
        throw new Error("Query timeout");
      }

      const hasMore = skip + data.length < totalCount;

      return c.json({
        success: true,
        data,
        hasMore,
        totalCount,
        currentPage,
        totalPages: Math.ceil(totalCount / limit),
        metrics: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("API Error:", {
      error: err.message,
      duration,
      timestamp: new Date().toISOString(),
      stack: err.stack,
    });

    if (
      err.message === "Query timeout" ||
      err.name === "MongooseError" ||
      duration >= TIMEOUT_MS
    ) {
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

/**
 * POST /api/putMemo - 创建新的备忘录
 */
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

/**
 * PATCH /api/updateMemo - 更新备忘录
 */
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

/**
 * DELETE /api/deleteMemo/:_id - 删除备忘录
 */
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

/**
 * 静态文件服务中间件
 */
app.use("*", async (c, next) => {
  // 如果是 API 请求，继续下一个中间件
  if (c.req.path.startsWith("/api/")) {
    return next();
  }

  try {
    // 尝试提供静态文件
    return await serveStatic({
      root: "./dist",
      rewriteRequestPath: (path) => {
        return path === "/" ? "/index.html" : path;
      },
    })(c);
  } catch {
    // 如果找不到文件，返回 index.html
    return serveStatic({
      root: "./dist",
      rewriteRequestPath: () => "/index.html",
    })(c);
  }
});

const port = process.env.PORT || 3001;

// 启动服务器
serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on port ${port}`);

export default handle(app);
