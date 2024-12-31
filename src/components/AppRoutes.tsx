import {
  Suspense,
  lazy,
  type FC,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedRoute from "./Auth/ProtectedRoute";
import SideBar from "./Nav/SideBar";
import AuthWrapper from "./Auth/AuthWrapper";
import Loading from "./Common/loading";

/** lazy 加载路由组件 */
const LoginPage = lazy(() => import("./Auth/LoginPage"));
const Memo = lazy(() => import("./Content/Memo"));
const Rest = lazy(() => import("./Content/Rest"));

type AppRoutesProps = {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
};

/**
 * 路由组件
 * @param isCollapsed - 是否折叠
 * @param setIsCollapsed - 设置是否折叠
 * @returns 路由组件
 */
const AppRoutes: FC<AppRoutesProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { isAuthenticated } = useAuth0();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path='/login'
          element={
            <Suspense fallback={<Loading spinning={true} />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          element={
            <>
              {isAuthenticated && (
                <SideBar
                  isCollapsed={isCollapsed}
                  setIsCollapsed={setIsCollapsed}
                />
              )}
              <AuthWrapper />
            </>
          }>
          <Route
            path='/'
            element={
              <Suspense fallback={<Loading spinning={true} />}>
                <ProtectedRoute element={<Memo />} />
              </Suspense>
            }
          />
          <Route
            path='/memo'
            element={
              <Suspense fallback={<Loading spinning={true} />}>
                <ProtectedRoute element={<Memo />} />
              </Suspense>
            }
          />
          <Route
            path='/rest'
            element={
              <Suspense fallback={<Loading spinning={true} />}>
                <ProtectedRoute element={<Rest />} />
              </Suspense>
            }
          />
          <Route path='*' element={<Navigate to='/memo' replace />} />
        </Route>
      </>
    )
  );

  return <RouterProvider router={router} />;
};

export default AppRoutes;
