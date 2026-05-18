import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if (
  typeof navigator !== "undefined" &&
  navigator.platform.toLowerCase().includes("mac")
) {
  document.documentElement.classList.add("platform-macos");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
