import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 使用 import.meta.url 获取当前文件的 URL
 * 使用 fileURLToPath 将 URL 转换为本地文件路径
 * 使用 path.dirname 获取当前文件所在目录
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    base: "/",
    root: process.cwd(),
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        },
      },
    },
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Memo",
          short_name: "Memo",
          description: "一个笔记应用",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "/img/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/img/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkOnly",
              method: "GET",
              options: {
                backgroundSync: {
                  name: "api-queue",
                },
              },
            },
          ],
        },
      }),
      compression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 10240,
        deleteOriginFile: false,
        filter: (file) => /\.(js|css|html|svg)$/.test(file),
      }),
      legacy({
        targets: ["defaults", "not IE 11"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        overlay: true,
      },
    },
  };
});
