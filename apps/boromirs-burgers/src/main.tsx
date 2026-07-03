import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getStandaloneBasename()}>
      <App basename={getStandaloneBasename()} />
    </BrowserRouter>
  </React.StrictMode>
);

function getStandaloneBasename() {
  const value = import.meta.env.VITE_APP_BASE_PATH?.trim();

  if (!value || value === "/" || value === "." || value === "./") {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("//")) {
    const pathname = new URL(value.startsWith("//") ? `http:${value}` : value).pathname;
    return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}
