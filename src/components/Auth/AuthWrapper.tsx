import { type FC, memo, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation, Outlet } from "react-router-dom";
import Loading from "../Common/loading";

const AuthWrapper: FC = memo(() => {
  const { isLoading, error, isAuthenticated, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      !isAuthenticating &&
      location.pathname !== "/login"
    ) {
      setIsAuthenticating(true);
      loginWithRedirect({ appState: { returnTo: location.pathname } });
    }
  }, [
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    location,
    isAuthenticating,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsAuthenticating(false);
    }
  }, [isAuthenticated]);

  if (isLoading || isAuthenticating) {
    return (
      <div className='loading-container'>
        <Loading spinning={true} tip='正在认证...' />
      </div>
    );
  }

  if (error) {
    return <div>认证错误: {error.message}</div>;
  }

  return <Outlet />;
});

export default AuthWrapper;
