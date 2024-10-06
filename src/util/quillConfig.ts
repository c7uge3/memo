import Quill from "quill";

// 定义 Inline 的类型
interface InlineBlot {
  new (): any;
  create(value: string): Node;
  formats(node: HTMLElement): any;
}

// 使用类型断言
const Inline = Quill.import("blots/inline") as unknown as InlineBlot;

class TagBlot extends (Inline as any) {
  static create(value: string): HTMLElement {
    let node = super.create(value) as HTMLElement;
    node.setAttribute("data-tag", value);
    node.textContent = `#${value}`;
    return node;
  }

  static formats(node: HTMLElement): string | undefined {
    return node.getAttribute("data-tag") || undefined;
  }

  static blotName = "tag";
  static tagName = "span";
  static className = "ql-tag";
}

Quill.register("formats/tag", TagBlot);

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
    ["tag"],
  ],
  tagModule: true,
};

// 配置 quill formats
const formats = ["list", "bold", "underline", "image", "tag"];

export { modules, formats };
