import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vercel from "vite-plugin-vercel";
import compression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    vercel(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["fav.png"],
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        injectionPoint: undefined,
      },
      manifest: {
        name: "MEMO",
        short_name: "MEMO",
        description: "一个简单的笔记应用",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "https://dub.sh/72I61jT", // 需要被预缓存的在线图片资源，转为了短链
            sizes: "64x64",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|html)$/,
            handler: "StaleWhileRevalidate",
          },
          {
            urlPattern: /^https:\/\/dub\.sh\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images",
              expiration: {
                maxEntries: 50, // 最大缓存数量
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
        ],
      },
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
    hmr: {
      overlay: false,
    },
  },
  build: {
    minify: "terser",
    target: "es2015", // 指定目标环境
    outDir: "dist",
    sourcemap: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // 4kb
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".")[1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        manualChunks: {
          vendor: ["react", "react-dom", "react-quill-new"],
          utils: ["jotai", "swr", "axios"],
        },
      },
    },
    reportCompressedSize: false,
    emptyOutDir: true,
    brotliSize: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-quill-new", "jotai", "swr", "axios"],
    exclude: ["@vite/client", "@vite/env"],
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
