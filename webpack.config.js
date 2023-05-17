const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CompressionWebpackPlugin = require("compression-webpack-plugin");
// const BundleAnalyzerPlugin =
//   require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  mode: "development",
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[hash:8].js",
    sourceMapFilename: "[name].[hash:8].map",
    chunkFilename: "[id].[hash:8].js",
  },
  cache: {
    type: "filesystem", // 使用文件系统进行缓存
    cacheDirectory: path.resolve(__dirname, ".cache"), // 指定缓存目录
  },
  watchOptions: {
    ignored: "./node_modules",
  },
  module: {
    noParse: /express|moment|mongodb/, // 不打包这些库
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2015",
        },
      },
      {
        test: /\.html$/,
        use: "html-loader",
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.(jpe?g|png|gif|svg|ico|otf|svg)$/i,
        use: "url-loader",
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx"],
  },
  devtool: "inline-source-map",
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./public/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[id].[contenthash:8].css",
    }),
    new CompressionWebpackPlugin({
      filename: "[path][base].gz", // 压缩后的文件名
      algorithm: "gzip", // 使用 gzip 压缩
      test: /\.([jt]sx?|(c|le)ss)$/, // 压缩 JavaScript 和 CSS 文件
      threshold: 10240, // 文件大小大于 10 KB 才进行压缩
      minRatio: 0.8, // 压缩后文件大小与原文件大小的比例大于等于 0.8 时才使用压缩
    }),
    new webpack.HotModuleReplacementPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
  optimization: {
    usedExports: true, // development 模式下手动开启 Tree Shaking
    // 文件切分
    splitChunks: {
      chunks: "all",
      minSize: 150000,
      maxSize: 250000,
      minChunks: 2, // 若被 2 个模块共享 则会被拆分成单独的 chunk
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        // 将重复的第三方模块提取至 vendors 的 chunk 中
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: -20, // 优先处理不同的 cache groups
          chunks: "all",
          reuseExistingChunk: true, // 用来确保没有重复的 chunk
        },
        default: {
          priority: -30,
          reuseExistingChunk: true,
        },
      },
    },
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()], // 文件压缩
  },
  performance: {
    hints: false,
  },
  devServer: {
    static: "./dist",
    compress: true,
    host: "0.0.0.0",
    port: 3000,
  },
};
