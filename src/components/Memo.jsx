import React, { useState, useEffect } from "react";
import Editor from "./Memo/Editor";
import List from "./Memo/List";
import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "animate.css/animate.min.css";

function Memo() {
  const flip = cssTransition({
    enter: "animate__animated animate__flipInX",
    exit: "animate__animated animate__flipOutX",
  });
  const [height, setHeight] = useState(
    Number(document.body.clientHeight) - 190 // 本应为变量，由计算获取...
  );

  // 根据所获取的 editor 的高度，即时生成 MemoList 应有的高度并重新渲染
  const generalListHeight = (editorHeight) => {
    const height =
      parseInt(document.body.clientHeight) -
      (editorHeight ? editorHeight + 54 : 190); // 同 line 14

    setHeight(height);
  };

  // 由 Quill 组件 callback，并传回 editorHeight
  const getEditorHeight = (editorHeight) => {
    generalListHeight(editorHeight);
  };

  const editorProps = { editorHeight: getEditorHeight, flip };
  const listProps = { height, flip };

  return (
    <main className='content-div'>
      <Editor {...editorProps} />
      <List {...listProps} />
      <ToastContainer />
    </main>
  );
}

export default Memo;
