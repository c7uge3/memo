import "./style/style.css";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import Wrapper from "./components/Wrapper";

const root = createRoot(document.getElementById("root"));
root.render(
  <Auth0Provider
    domain='chio.us.auth0.com'
    clientId='znZ6sL8W3ErYbPV9RYEbZbTFX6CmpOWN'
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://chio.us.auth0.com/api/v2/",
      scope: "openid profile read:current_user update:current_user_metadata",
    }}
    cacheLocation='localstorage'
    useRefreshTokens={true}>
    <Wrapper />
  </Auth0Provider>
);
