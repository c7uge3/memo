import Quill from "quill";

interface QuillTagModuleOptions {
  // 如果需要，可以在这里添加选项
}

class QuillTagModule {
  quill: Quill;
  options: QuillTagModuleOptions;

  constructor(quill: Quill, options: QuillTagModuleOptions) {
    this.quill = quill;
    this.options = options;
    const toolbar = this.quill.getModule("toolbar") as any;
    toolbar.addHandler("tag", this.tagHandler.bind(this));

    this.quill.on("text-change", (delta, oldDelta, source) => {
      if (source === "user") {
        const text = this.quill.getText();
        const regex = /#(\w+)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const index = match.index;
          const length = match[0].length;
          this.quill.formatText(index, length, "tag", match[1], "user");
        }
      }
    });
  }

  tagHandler(): void {
    const range = this.quill.getSelection();
    if (range) {
      const tag = prompt("Enter tag:");
      if (tag) {
        this.quill.insertText(range.index, `#${tag} `, "tag", tag, "user");
        this.quill.setSelection(range.index + tag.length + 2);
      }
    }
  }

  static register(quill: typeof Quill): void {
    quill.register("modules/tagModule", QuillTagModule);
  }
}

export default QuillTagModule;
