import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RemoteHandle = {
  unmount: () => void;
};

type RemoteModule = {
  mount: (element: HTMLElement, options?: RemoteMountOptions) => RemoteHandle;
};

type FederatedRemoteModule = RemoteModule | { default: RemoteModule };

type FederatedRemoteEntry = {
  init?: (shareScope: Record<string, unknown>) => void | Promise<void>;
  get: (module: string) => Promise<(() => FederatedRemoteModule) | FederatedRemoteModule>;
};

type RemoteMountOptions = {
  basename?: string;
  remoteEntries?: HostManifest["remotes"];
  apiBaseUrl?: string;
};

type RemoteDefinition = {
  id: string;
  name: string;
  description: string;
  accent: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  localRemoteEntryUrl: string;
};

type HostManifest = {
  environment: string;
  remotes: Record<
    string,
    {
      version: string;
      remoteEntryUrl: string;
      apiBaseUrl?: string;
    }
  >;
};

type HostStatus = {
  environment: string;
  activeRemotes: string[];
};

const remotes: RemoteDefinition[] = [
  {
    id: "frodos-franks",
    name: "Frodos Franks",
    description: "Independent hot dog shop application.",
    accent: "bg-red-600",
    icon: HotDogIcon,
    localRemoteEntryUrl: "http://localhost:5174/assets/remoteEntry.js"
  },
  {
    id: "boromirs-burgers",
    name: "Boromirs Burgers",
    description: "Independent burger operations application.",
    accent: "bg-sky-700",
    icon: BurgerIcon,
    localRemoteEntryUrl: "http://localhost:5175/assets/remoteEntry.js"
  }
];

const environments = ["dev", "staging", "prod"] as const;
type EnvironmentName = (typeof environments)[number];

const deploymentApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_DEPLOYMENT_API_URL ?? "http://localhost:5050");
const hostApiBaseUrl = import.meta.env.VITE_HOST_API_URL ?? "http://localhost:6073/api";
const hostEnvironment = getHostEnvironment();
const isEnvironmentHost = hostEnvironment !== null;

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HostShell />} />
      <Route path="/:remoteId/*" element={<HostShell />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HostShell() {
  const { remoteId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [manifest, setManifest] = useState<HostManifest | null>(null);
  const [hostStatus, setHostStatus] = useState<HostStatus | null>(null);
  const [manifestStatus, setManifestStatus] = useState<"error" | "loading" | "ready">(
    isEnvironmentHost ? "loading" : "ready"
  );
  const remote = remotes.find((item) => item.id === remoteId);
  const runtimeRemoteEntryUrl =
    remote && manifestStatus === "ready"
      ? isEnvironmentHost
        ? manifest?.remotes[remote.id]?.remoteEntryUrl ?? null
        : remote.localRemoteEntryUrl
      : null;

  useEffect(() => {
    let disposed = false;

    fetch(`${hostApiBaseUrl}/host/status`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Host status request failed: ${response.status}`);
        }

        return response.json() as Promise<HostStatus>;
      })
      .then((nextStatus) => {
        if (!disposed) {
          setHostStatus(nextStatus);
        }
      })
      .catch((error) => {
        console.warn("Host API status could not be loaded.", error);
      });

    if (!hostEnvironment) {
      setManifest(null);
      setManifestStatus("ready");
      return () => {
        disposed = true;
      };
    }

    setManifest(null);
    setManifestStatus("loading");

    fetch(hostManifestUrl(hostEnvironment))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Manifest request failed: ${response.status}`);
        }

        return response.json() as Promise<HostManifest>;
      })
      .then((nextManifest) => {
        if (!disposed) {
          setManifest(nextManifest);
          setManifestStatus("ready");
        }
      })
      .catch((error) => {
        console.warn("Deployment manifest could not be loaded.", error);
        if (!disposed) {
          setManifestStatus("error");
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  if (remoteId && !remote) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="grid h-screen grid-cols-[auto_1fr] overflow-hidden bg-muted/30 text-foreground">
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-background transition-[width] duration-200",
          collapsed ? "w-24" : "w-64"
        )}
      >
        <header className="flex min-h-16 items-center justify-between gap-2 border-b border-border px-3">
          {collapsed ? (
            <div className="h-8 w-8 rounded-md bg-primary" aria-hidden="true" />
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Host</p>
              <h1 className="text-lg font-semibold">Applications</h1>
            </div>
          )}
          <Button
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            size="icon"
            variant="outline"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </header>

        <nav className="grid gap-3 p-3">
          {remotes.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) =>
                  cn(
                    "group flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 text-center text-sm font-medium text-card-foreground shadow-sm transition hover:border-ring hover:bg-accent",
                    collapsed ? "min-h-20" : "min-h-28",
                    isActive && "border-ring bg-accent shadow"
                  )
                }
              >
                <span className={cn("flex items-center justify-center rounded-md text-white", item.accent, collapsed ? "h-10 w-10" : "h-12 w-12")}>
                  <Icon className={collapsed ? "h-7 w-7" : "h-8 w-8"} aria-hidden="true" />
                </span>
                {collapsed ? <span className="sr-only">{item.name}</span> : <span className="leading-tight">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {remote ? "Running federated application" : "Micro frontend host"}
              </p>
              <h2 className="text-lg font-semibold">{remote?.name ?? "Select somewhere to eat"}</h2>
            </div>
            <div className="hidden rounded-md border border-border px-3 py-2 text-sm text-muted-foreground sm:block">
              {hostStatus ? `${hostLabel()} - ${hostStatus.activeRemotes.length} remotes` : hostLabel()}
            </div>
          </header>
          {remote && manifestStatus === "loading" ? (
            <div className="grid min-h-0 flex-1 place-items-center text-sm text-muted-foreground">Loading deployment manifest...</div>
          ) : remote && manifestStatus === "error" ? (
            <div className="grid min-h-0 flex-1 place-items-center px-6 text-center text-sm text-destructive">
              Deployment manifest failed to load for {hostLabel()}.
            </div>
          ) : remote && runtimeRemoteEntryUrl ? (
            <RemoteMount
              key={`${remote.id}:${runtimeRemoteEntryUrl}`}
              remote={remote}
              remoteEntryUrl={runtimeRemoteEntryUrl}
              apiBaseUrl={manifest?.remotes[remote.id]?.apiBaseUrl}
              remoteEntries={manifest?.remotes}
            />
          ) : remote && isEnvironmentHost ? (
            <div className="grid min-h-0 flex-1 place-items-center px-6 text-center text-sm text-muted-foreground">
              No deployed release is assigned to {remote.name} in {hostLabel()}.
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="grid min-h-0 flex-1 place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <h3 className="text-3xl font-semibold tracking-normal">Select somewhere to eat</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Choose Frodos Franks or Boromirs Burgers from the navigation panel to launch an application.
        </p>
      </div>
    </section>
  );
}

function RemoteMount({
  remote,
  remoteEntryUrl,
  apiBaseUrl,
  remoteEntries
}: {
  remote: RemoteDefinition;
  remoteEntryUrl: string;
  apiBaseUrl?: string;
  remoteEntries?: HostManifest["remotes"];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    let handle: RemoteHandle | undefined;
    const container = containerRef.current;

    setStatus("loading");
    loadRemoteModule(remoteEntryUrl)
      .then((remoteModule) => {
        if (disposed || !container) {
          return;
        }

        handle = resolveRemoteModule(remoteModule).mount(container, {
          basename: `/${remote.id}`,
          apiBaseUrl,
          remoteEntries
        });
        setStatus("ready");
      })
      .catch((error) => {
        console.error(`Failed to load ${remote.name}`, error);
        if (!disposed) {
          setStatus("error");
        }
      });

    return () => {
      disposed = true;
      handle?.unmount();
      handle = undefined;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [apiBaseUrl, remote, remoteEntryUrl, remoteEntries]);

  return (
    <section className="relative min-h-0 flex-1 bg-background">
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Loading remote...</div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-destructive">
          Remote module failed to load. Confirm the remote build is being served.
        </div>
      ) : null}
      <div ref={containerRef} className="h-full min-h-0 overflow-auto" />
    </section>
  );
}

function hostManifestUrl(environment: EnvironmentName) {
  return `${deploymentApiBaseUrl}/api/environments/${environment}/host-manifest`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getHostEnvironment(): EnvironmentName | null {
  const value = import.meta.env.VITE_HOST_ENVIRONMENT?.trim();
  return environments.includes(value as EnvironmentName) ? (value as EnvironmentName) : null;
}

function hostLabel() {
  return hostEnvironment ? `${hostEnvironment} environment` : "local integration";
}

function resolveRemoteModule(remoteModule: FederatedRemoteModule): RemoteModule {
  return "mount" in remoteModule ? remoteModule : remoteModule.default;
}

async function loadRemoteModule(remoteEntryUrl: string): Promise<FederatedRemoteModule> {
  const remoteEntry = (await import(/* @vite-ignore */ remoteEntryUrl)) as FederatedRemoteEntry;
  await remoteEntry.init?.({});
  const exposedModule = await remoteEntry.get("./RemoteApp");
  return typeof exposedModule === "function" ? exposedModule() : exposedModule;
}

function HotDogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M11 39c3.5 9 16.5 13 28 8.5S58 32.5 54.5 23.5 38 10.5 26.5 15 7.5 30 11 39Z" fill="currentColor" opacity="0.32" />
      <path d="M13.5 36.5c5.8 3 14.5 2.4 23-1.2s15.2-9.5 17.4-15.6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 43.5c5.8 3 14.5 2.4 23-1.2S56.2 32.8 58.4 26.7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M20 31c2.8.8 5.2 1.1 7.6-.8 2-1.6 3.8-1.8 5.9-.4 2.2 1.5 4.4 1.1 7.2-1.6" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BurgerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 30c1-9.5 9.4-17 20-17s19 7.5 20 17H12Z" fill="currentColor" opacity="0.34" />
      <path d="M12 30h40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 39h36" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
      <path d="M16 47h32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 22h.1M32 20h.1M40 23h.1" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
