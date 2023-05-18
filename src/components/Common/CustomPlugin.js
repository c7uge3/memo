class CustomPlugin {
  apply(compiler) {
    // 在 Webpack 的 compilation 阶段完成时执行的回调函数
    compiler.hooks.compilation.tap("CustomPlugin", (compilation) => {
      console.log("The custom plugin is starting to work...");

      // 挂载一个新的模块资源到 assets 对象里
      compilation.assets["new-file.txt"] = {
        source: () => "Hello, World!",
        size: () => Buffer.from("Hello, World!").length,
      };
    });
  }
}

module.exports = CustomPlugin;
