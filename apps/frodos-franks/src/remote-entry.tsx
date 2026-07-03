import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

export type RemoteHandle = {
  unmount: () => void;
};

export type RemoteMountOptions = {
  apiBaseUrl?: string;
  basename?: string;
  remoteEntries?: Record<string, { apiBaseUrl?: string; version: string; remoteEntryUrl: string }>;
};

export function mount(element: HTMLElement, options: RemoteMountOptions = {}): RemoteHandle {
  const root: Root = createRoot(element);

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={options.basename}>
        <App apiBaseUrl={options.apiBaseUrl} basename={options.basename} remoteEntries={options.remoteEntries} />
      </BrowserRouter>
    </React.StrictMode>
  );

  return {
    unmount: () => root.unmount()
  };
}
