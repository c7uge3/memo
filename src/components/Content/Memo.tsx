import { lazy, Suspense, useState, useDeferredValue } from "react";
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
  const fixedHeight = 136; // Editor 组件的默认高度
  const flexHeight = 50; // Editor 组件高度变化时会用到这个数值
  const [listHeight, setListHeight] = useState(
    () => window.innerHeight - (fixedHeight + flexHeight)
  );

  // 根据所获取的 editor 的高度，即时生成 Memo 列表内容区应有的高度，并重新渲染
  const generalListHeight = (editorHeight: number) => {
    const newHeight = window.innerHeight - (editorHeight + flexHeight);
    if (listHeight !== newHeight) {
      setListHeight(newHeight);
    }
  };

  // 当 generalListHeight 发生变化时，会延迟渲染
  const deferredSearchValue = useDeferredValue(generalListHeight);

  return (
    <main className='content-div'>
      <Editor editorHeight={deferredSearchValue} />
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
      <Suspense fallback={<Loading spinning={false} />}>
        <ToastContainer />
      </Suspense>
    </main>
  );
}

export default Memo;
