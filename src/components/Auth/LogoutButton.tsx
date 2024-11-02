import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    localStorage.removeItem("isRedirecting");
    logout({
      logoutParams: {
        returnTo: `${window.location.origin}`,
      },
    });
  };

  return (
    <button onClick={handleLogout} className='logout-button' title='登出'>
      登出
    </button>
  );
};

export default LogoutButton;
