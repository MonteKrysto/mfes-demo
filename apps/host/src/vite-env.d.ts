/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOYMENT_MANIFEST_URL?: string;
}

declare module "frodosFranks/RemoteApp" {
  export type RemoteHandle = {
    unmount: () => void;
  };

  export type RemoteMountOptions = {
    basename?: string;
  };

  export function mount(element: HTMLElement, options?: RemoteMountOptions): RemoteHandle;
}

declare module "boromirsBurgers/RemoteApp" {
  export type RemoteHandle = {
    unmount: () => void;
  };

  export type RemoteMountOptions = {
    basename?: string;
  };

  export function mount(element: HTMLElement, options?: RemoteMountOptions): RemoteHandle;
}
