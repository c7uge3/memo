import React, {
  lazy,
  Suspense,
  useState,
  useCallback,
  useDeferredValue,
} from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./Memo/ErrorBoundary";
import Loading from "./Common/loading";

const Editor = lazy(() => import("./Memo/Editor"));
const List = lazy(() => import("./Memo/List"));

/**
 * Memo 组件，包含 Editor 和 List 组件
 * @returns Memo 组件
 */
function Memo() {
  const fixedHeight = 136; // Editor 组件的默认高度
  const flexHeight = 50; // Editor 组件高度变化时会用到这个数值
  const [listHeight, setListHeight] = useState<number>(
    window.innerHeight - (fixedHeight + flexHeight)
  );

  // 根据所获取的 editor 的高度，即时生成 Memo 列表内容区应有的高度，并重新渲染
  const generalListHeight = useCallback((editorHeight: number) => {
    if (listHeight === window.innerHeight - (editorHeight + flexHeight)) {
      return;
    }
    setListHeight(window.innerHeight - (editorHeight + flexHeight));
  }, []);

  // 当 generalListHeight 发生变化时，会延迟渲染
  const deferredSearchValue = useDeferredValue(generalListHeight);

  return (
    <main className='content-div'>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className='fade-in'>
              <Loading spinning={true} />
            </div>
          }>
          <Editor editorHeight={deferredSearchValue} />
          <List listHeight={listHeight} />
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
    </main>
  );
}

export default Memo;
