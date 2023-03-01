import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";

export default defineConfig({
  // 插件配置
  plugins: [reactRefresh()],
  // 别名配置
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 服务器配置
  server: {
    port: 3000, // 服务器端口号
  },
  // 构建配置
  build: {
    outDir: "build", // 构建输出目录
    sourcemap: true, // 生成 sourcemap
    minify: true,
    esbuild: {
      // 配置 esbuild 的选项
      jsxInject: "import React from 'react'",
    },
    brotliSize: true, // 是否生成 .br 压缩文件
    chunkSizeWarningLimit: 2000, // 代码块大小警告阈值
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "./index.html"), // 入口文件
      },
      output: {
        manualChunks: {
          // html: ["./public/index.html"], // 将 HTML 文件单独打包为一个 chunk
          // 手动分块，将第三方库和公共代码分离出来
          react: ["react", "react-dom"],
          vendor: ["react-quill"],
        },
      },
    },
  },
  // 优化配置
  optimizeDeps: {
    include: ["react", "react-dom", "react-quill"], // 只引入需要的依赖，减小打包体积
  },
});

/**
引入了 @vitejs/plugin-react-refresh 插件，以支持 React 的热更新。
配置了 resolve.alias，以简化路径引用。
配置了开发服务器的端口号。
将构建结果输出到 build 目录下，并使用 esbuild 压缩代码。
使用 Rollup 进行构建，配置了入口文件。
server.open：设置为 true 时，启动服务器后自动打开浏览器。
server.proxy：代理设置，可用于将接口请求代理到本地服务。
build.sourcemap：生成 sourcemap，方便调试。
build.brotliSize：设置为 false，不生成 .br 压缩文件，可减小构建时间。
build.chunkSizeWarningLimit：代码块大小警告阈值，超过此值会输出警告。
build.rollupOptions.output.manualChunks：手动分块，将第三方库和公共代码分离出来，减小构建体积。
optimizeDeps.include：只引入需要的依赖，减小打包体积。
*/
