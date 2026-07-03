/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOYMENT_API_URL?: string;
  readonly VITE_HOST_ENVIRONMENT?: string;
  readonly VITE_HOST_API_URL?: string;
}

declare module "frodosFranks/RemoteApp" {
  export type RemoteHandle = {
    unmount: () => void;
  };

  export type RemoteMountOptions = {
    basename?: string;
    apiBaseUrl?: string;
  };

  export function mount(element: HTMLElement, options?: RemoteMountOptions): RemoteHandle;
}

declare module "boromirsBurgers/RemoteApp" {
  export type RemoteHandle = {
    unmount: () => void;
  };

  export type RemoteMountOptions = {
    basename?: string;
    apiBaseUrl?: string;
  };

  export function mount(element: HTMLElement, options?: RemoteMountOptions): RemoteHandle;
}
