import { lazy, Suspense, useState, useRef, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "../Common/ErrorBoundary";
import Loading from "../Common/loading";
import Editor from "../Memo/MemoEditor";
import List from "../Memo/MemoList";

const ToastContainer = lazy(() =>
  import("react-toastify").then((module) => ({
    default: module.ToastContainer,
  }))
);

/**
 * Memo 组件，包含 Editor 和 List 组件
 * @returns Memo 组件
 */
function Memo() {
  const [listHeight, setListHeight] = useState(window.innerHeight);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // 监听窗口大小变化
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current && editorRef.current) {
        const contentHeight = contentRef.current.clientHeight;
        const editorHeight = editorRef.current.clientHeight;
        setListHeight(contentHeight - editorHeight - 42);
      }
    };

    const resizeObserver = new ResizeObserver(updateHeight);

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (editorRef.current) {
      resizeObserver.observe(editorRef.current);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

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
      <Suspense fallback={null}>
        <ToastContainer />
      </Suspense>
    </main>
  );
}

export default Memo;
