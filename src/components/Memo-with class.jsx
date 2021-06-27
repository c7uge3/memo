import React, { Component } from "react";
import Editor from "./Memo/Editor";
import List from "./Memo/List";
import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "animate.css/animate.min.css";

function MemoHOC(Quill, MemoList) {
  class Memo extends Component {
    constructor(props) {
      super(props);

      const height = Number(document.body.clientHeight) - 190; // 本应使用变量，这里不再计算了...
      this.state = {
        height,
        flip: cssTransition({
          enter: "animate__animated animate__flipInX",
          exit: "animate__animated animate__flipOutX",
        }), // animate 效果
      };
    }

    // 根据所获取的 editor 的高度，即时生成 MemoList 应有的高度并重新渲染
    generalListHeight = (editorHeight) => {
      const height =
        parseInt(document.body.clientHeight) -
        (editorHeight ? editorHeight + 54 : 190); // 同 line 13

      this.setState({ height });
    };

    // 由 Quill 组件 callback，并传回 editorHeight
    getEditorHeight = (editorHeight) => {
      this.generalListHeight(editorHeight);
    };

    render() {
      const { flip } = this.state;
      const editorHeight = this.getEditorHeight;
      const forEditorSpread = { editorHeight, flip };

      return (
        <main className='content-div'>
          <Quill {...forEditorSpread} />
          <MemoList {...this.state} />
          <ToastContainer />
        </main>
      );
    }
  }
  return Memo;
}

const Memo = MemoHOC(Editor, List);

export default Memo;
