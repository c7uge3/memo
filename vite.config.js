import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";
import vercel from "vite-plugin-vercel";
import path from "path";

export default defineConfig(({ mode }) => {
  return {
    base: "/",
    root: process.cwd(),
    plugins: [
      react(),
      compression({
        algorithm: "gzip",
        ext: ".gz",
      }),
      legacy({
        targets: ["defaults", "not IE 11"],
      }),
      vercel(),
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
      proxy:
        mode !== "production"
          ? {
              "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
              },
            }
          : undefined,
      historyApiFallback: true,
    },
    build: {
      minify: "terser",
      target: "es2015",
      outDir: "dist",
      sourcemap: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      assetsDir: "assets",
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
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
        external: ["date-fns-tz/esm/index.js"],
      },
      reportCompressedSize: false,
      emptyOutDir: true,
      brotliSize: false,
      manifest: true,
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-quill-new",
        "jotai",
        "swr",
        "axios",
      ],
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
  };
});
