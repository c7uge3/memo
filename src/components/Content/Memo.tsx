/**
 * Memo 模块
 * 包含编辑器和列表组件
 * @module Memo
 */

import { Suspense, useState, useRef, useEffect } from "react";
import ErrorBoundary from "../Common/ErrorBoundary";
import Loading from "../Common/loading";
import Editor from "../Memo/MemoEditor";
import List from "../Memo/MemoList";

/**
 * Memo 主组件
 * 管理编辑器和列表的布局及交互
 * @returns React 组件
 */
function Memo() {
  const [listHeight, setListHeight] = useState(window.innerHeight);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * 监听窗口大小变化
   * 动态调整列表高度
   */
  useEffect(() => {
    /**
     * 更新高度的处理函数
     * 根据内容和编辑器的高度计算列表高度
     */
    const updateHeight = () => {
      if (contentRef.current && editorRef.current) {
        const contentHeight = contentRef.current.clientHeight;
        const editorHeight = editorRef.current.clientHeight;
        setListHeight(contentHeight - editorHeight - 42);
      }
    };

    // 创建 ResizeObserver 实例
    const resizeObserver = new ResizeObserver(updateHeight);

    // 观察内容和编辑器元素
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (editorRef.current) {
      resizeObserver.observe(editorRef.current);
    }

    // 监听窗口大小变化
    window.addEventListener("resize", updateHeight);

    /**
     * 清理监听器
     * 在组件卸载时移除所有监听器
     */
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  /**
   * 处理编辑器高度变化
   * 更新列表区域的高度
   * @param height - 编辑器高度
   */
  const handleEditorHeight = () => {
    if (contentRef.current && editorRef.current) {
      const contentHeight = contentRef.current.clientHeight;
      const editorHeight = editorRef.current.clientHeight;
      setListHeight(contentHeight - editorHeight - 42);
    }
  };

  return (
    <main ref={contentRef} className='content-div'>
      <div ref={editorRef}>
        <Editor editorHeight={handleEditorHeight} />
      </div>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className='fade-in'>
              <Loading spinning={true} />
            </div>
          }>
          <List listHeight={listHeight} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export default Memo;
