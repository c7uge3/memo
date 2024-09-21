import { createRoot } from "react-dom/client";
import Wrapper from "./components/Wrapper";

const root = createRoot(document.getElementById("root"));
root.render(<Wrapper />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
