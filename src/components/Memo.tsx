import React, { useState, useCallback } from "react";
import Editor from "./Memo/Editor";
import List from "./Memo/List";
import {
  ToastContainer,
  cssTransition,
  ToastTransitionProps,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "animate.css/animate.min.css";

function Memo() {
  type Flip = ({
    children,
    position,
    preventExitTransition,
    done,
    nodeRef,
    isIn,
  }: ToastTransitionProps) => JSX.Element;
  const flip: Flip = cssTransition({
    enter: "animate__animated animate__flipInX",
    exit: "animate__animated animate__flipOutX",
  });
  const fixedHeight: number = 200; // Editor 组件的默认高度
  const flexHeight: number = 50; // Editor 组件高度变化时会用到这个数值
  const defListHeight: number = window.innerHeight - fixedHeight;
  const [listHeight, setListHeight] = useState<number>(defListHeight);
  type Height = (editorHeight: number) => void;

  // 根据所获取的 editor 的高度，即时生成 Memo 列表内容区应有的高度，并重新渲染
  const generalListHeight = useCallback<Height>((editorHeight) => {
    const listHeight = window.innerHeight - (editorHeight + flexHeight);
    setListHeight(listHeight);
  }, []);

  // 从子组件 Editor 中获取到 editorHeight，传递给 generalListHeight 函数
  const generalEditorHeight = useCallback<Height>((editorHeight) => {
    generalListHeight(editorHeight);
  }, []);

  const editorProps: { editorHeight: Height; flip: Flip } = {
    editorHeight: generalEditorHeight,
    flip,
  };
  const listProps: { listHeight: number; flip: Flip } = { listHeight, flip };

  return (
    <main className='content-div'>
      <Editor {...editorProps} />
      <List {...listProps} />
      <ToastContainer />
    </main>
  );
}

export default React.memo(Memo);
