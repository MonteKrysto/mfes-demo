import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

export type RemoteHandle = {
  unmount: () => void;
};

export type RemoteMountOptions = {
  basename?: string;
};

export function mount(element: HTMLElement, options: RemoteMountOptions = {}): RemoteHandle {
  const root: Root = createRoot(element);

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={options.basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );

  return {
    unmount: () => root.unmount()
  };
}
