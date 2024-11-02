import React, {
  FC,
  useMemo,
  memo,
  Dispatch,
  SetStateAction,
  Suspense,
} from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedRoute from "./Auth/ProtectedRoute";
import SideBar from "./Nav/SideBar";
import Memo from "./Content/Memo";
import AuthWrapper from "./Auth/AuthWrapper";
import LoginPage from "./Auth/LoginPage";

const Rest = React.lazy(() => import("./Content/Rest"));

type AppRoutesProps = {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
};

const AppRoutes: FC<AppRoutesProps> = memo(
  ({ isCollapsed, setIsCollapsed }) => {
    const { isAuthenticated } = useAuth0();

    const memoizedRoutes = useMemo(
      () => (
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route element={<AuthWrapper />}>
            <Route path='/' element={<ProtectedRoute element={<Memo />} />} />
            <Route
              path='/memo'
              element={<ProtectedRoute element={<Memo />} />}
            />
            <Route
              path='/rest'
              element={
                <Suspense fallback={<div>加载中...</div>}>
                  <ProtectedRoute element={<Rest />} />
                </Suspense>
              }
            />
          </Route>
          <Route path='*' element={<Navigate to='/memo' replace />} />
        </Routes>
      ),
      []
    );

    return (
      <>
        {isAuthenticated && (
          <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        )}
        {memoizedRoutes}
      </>
    );
  }
);

export default AppRoutes;
