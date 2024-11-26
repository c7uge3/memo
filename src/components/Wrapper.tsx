import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  type FC,
  type Dispatch,
  type SetStateAction,
} from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoutes";

const Wrapper: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSetIsCollapsed = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      setIsCollapsed(value);
    },
    []
  );

  const memoizedAppRoutesProps = useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed: handleSetIsCollapsed,
    }),
    [isCollapsed, handleSetIsCollapsed]
  );

  // 预加载 Rest 组件
  useEffect(() => {
    const preloadRest = () => {
      import("./Content/Rest");
    };
    preloadRest();
  }, []);

  return (
    <section className='wrapper-div'>
      <Router>
        <AppRoutes {...memoizedAppRoutesProps} />
      </Router>
    </section>
  );
};

export default memo(Wrapper);
