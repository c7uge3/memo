import { Context, Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { etag } from "hono/etag";
import { validator } from "hono/validator";
import mongoose from "mongoose";
import Data from "./data.js";
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
app.get("/api/getMemo", async (c) => {
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
});

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

// 添加 URL 构建函数
function getFullUrl(request: Request | any): string {
  // 获取协议（默认为 https）
  const protocol = request.headers["x-forwarded-proto"] || "https";
  // 获取主机名
  const host =
    request.headers["x-forwarded-host"] ||
    request.headers["host"] ||
    "vercel.app";
  // 获取原始 URL 路径和查询参数
  const originalUrl = request.url || "";

  // 如果已经是完整 URL，直接返回
  if (originalUrl.startsWith("http")) {
    return originalUrl;
  }

  // 构建完整 URL
  return `${protocol}://${host}${originalUrl}`;
}

// 修改请求头适配函数
function adaptHeaders(rawHeaders: any): Headers {
  const headers = new Headers();
  if (rawHeaders) {
    Object.entries(rawHeaders).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "string") {
            headers.append(key, v);
          }
        });
      }
    });
  }
  return headers;
}

// 修改默认导出处理函数
export default async function handler(request: Request | any, context: any) {
  try {
    // 构建完整 URL
    const fullUrl = getFullUrl(request);

    // 创建适配的请求对象
    const adaptedRequest = new Request(fullUrl, {
      method: request.method,
      headers: adaptHeaders(request.headers),
      body: request.body,
      // 只在需要时添加以下选项
      ...(request.body ? { duplex: "half" } : {}),
    });

    return await app.fetch(adaptedRequest, context);
  } catch (error) {
    console.error("Request handling error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// 开发环境服务器启动
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3001;
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port: port as number,
  });
}
