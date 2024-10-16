// 配置 quill modules
const modules = {
  toolbar: [
    [
      { list: "bullet" },
      { list: "ordered" },
      "bold",
      "underline",
      "image",
      "clean",
    ],
  ],
};

// 配置 quill formats
const formats: Array<string> = ["list", "bold", "underline", "image"];

export { modules, formats };
