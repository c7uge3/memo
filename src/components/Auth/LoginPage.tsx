import { type FC, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import Loading from "../Common/loading";

const LoginPage: FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, hasRedirected]);

  if (isLoading || (!isAuthenticated && hasRedirected)) {
    return (
      <div className='loading-container'>
        <Loading spinning={true} tip='正在前往登录页面...' />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to='/' />;
  }

  return null;
};

export default LoginPage;
