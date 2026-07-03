import { useEffect, useRef, useState, type ReactNode } from "react";
import { BadgePercent, Beaker, ClipboardList, Flame, Home, Layers3, Shield } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AppProps = {
  basename?: string;
  remoteEntries?: Record<string, { version: string; remoteEntryUrl: string }>;
};

type PanelItem = {
  title: string;
  value: string;
  detail: string;
};

type BuildItem = {
  name: string;
  layers: string;
  risk: string;
};

type GrillResponse = {
  pattiesOnDeck: number;
  panels: PanelItem[];
};

type BuildsResponse = {
  builds: BuildItem[];
};

type PanelsResponse = {
  panels: PanelItem[];
};

type LoyaltyResponse = {
  rewardClaims: number;
  panels: PanelItem[];
};

type RemoteHandle = {
  unmount: () => void;
};

type RemoteModule = {
  mount: (element: HTMLElement, options?: { basename?: string }) => RemoteHandle;
};

type FederatedRemoteModule = RemoteModule | { default: RemoteModule };

type FederatedRemoteEntry = {
  init?: (shareScope: Record<string, unknown>) => void | Promise<void>;
  get: (module: string) => Promise<(() => FederatedRemoteModule) | FederatedRemoteModule>;
};

const apiBaseUrl = import.meta.env.VITE_BOROMIRS_API_URL ?? "http://localhost:6075/api";
const gondorSaucesRemoteEntryUrl = import.meta.env.VITE_GONDOR_SAUCES_REMOTE_ENTRY_URL ?? "http://localhost:5178/assets/remoteEntry.js";

const navItems = [
  { to: "/", label: "Grill", icon: Home },
  { to: "/builds", label: "Builds", icon: Layers3 },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/loyalty", label: "Loyalty", icon: BadgePercent },
  { to: "/gondor-sauces", label: "Gondor Sauces", icon: Beaker }
];

export function App({ basename, remoteEntries }: AppProps) {
  const gondorSaucesEntryUrl = remoteEntries?.["gondor-sauces"]?.remoteEntryUrl ?? gondorSaucesRemoteEntryUrl;

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="border-b border-border bg-slate-950 px-5 py-5 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-500">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">Remote host</p>
            <h1 className="text-2xl font-bold">Boromirs Burgers</h1>
          </div>
        </div>
        <nav className="mt-6 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start text-white hover:bg-sky-500/20 hover:text-white",
                    isActive && "bg-sky-500 text-white hover:bg-sky-500"
                  )
                }
              >
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <Routes>
          <Route path="/" element={<Grill />} />
          <Route path="/builds" element={<Builds />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route
            path="/gondor-sauces/*"
            element={<NestedRemote name="Gondor Sauces" remoteEntryUrl={gondorSaucesEntryUrl} basename={joinBasename(basename, "gondor-sauces")} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Grill() {
  const { data, status } = useApiData<GrillResponse>("/burgers/grill");

  return (
    <Page title="Grill command" subtitle="Live line status fetched from the burger hall API." status={status}>
      <HeroMetric icon={<Flame className="h-6 w-6" />} label="Patties on deck" value={String(data?.pattiesOnDeck ?? "...")} />
      {(data?.panels ?? []).map((panel) => (
        <Panel key={panel.title} title={panel.title} value={panel.value} detail={panel.detail} />
      ))}
    </Page>
  );
}

function Builds() {
  const { data, status } = useApiData<BuildsResponse>("/burgers/builds");

  return (
    <Page title="Burger builds" subtitle="Configured stacks with prep notes from the API." status={status}>
      {(data?.builds ?? []).map((build) => (
        <Build key={build.name} name={build.name} layers={build.layers} risk={build.risk} />
      ))}
    </Page>
  );
}

function Orders() {
  const { data, status } = useApiData<PanelsResponse>("/burgers/orders");

  return (
    <Page title="Order dispatch" subtitle="Burger tickets grouped by service channel." status={status}>
      {(data?.panels ?? []).map((panel) => (
        <Panel key={panel.title} title={panel.title} value={panel.value} detail={panel.detail} />
      ))}
    </Page>
  );
}

function Loyalty() {
  const { data, status } = useApiData<LoyaltyResponse>("/burgers/loyalty");

  return (
    <Page title="Loyalty hall" subtitle="Rewards activity for returning guests." status={status}>
      <HeroMetric icon={<BadgePercent className="h-6 w-6" />} label="Reward claims" value={String(data?.rewardClaims ?? "...")} />
      {(data?.panels ?? []).map((panel) => (
        <Panel key={panel.title} title={panel.title} value={panel.value} detail={panel.detail} />
      ))}
    </Page>
  );
}

function Page({ title, subtitle, status, children }: { title: string; subtitle: string; status: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Boromirs Burgers API</p>
      <h2 className="mt-1 text-3xl font-bold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
      {status === "loading" ? <p className="mt-5 text-sm text-muted-foreground">Loading Burgers API data...</p> : null}
      {status === "error" ? <p className="mt-5 text-sm text-destructive">Unable to load Burgers API data.</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function NestedRemote({ name, remoteEntryUrl, basename }: { name: string; remoteEntryUrl: string; basename: string }) {
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

        handle = resolveRemoteModule(remoteModule).mount(container, { basename });
        setStatus("ready");
      })
      .catch((error) => {
        console.error(`Failed to load ${name}`, error);
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
  }, [basename, name, remoteEntryUrl]);

  return (
    <section className="relative min-h-[30rem]">
      {status === "loading" ? <div className="grid min-h-[30rem] place-items-center text-sm text-muted-foreground">Loading nested remote...</div> : null}
      {status === "error" ? (
        <div className="grid min-h-[30rem] place-items-center px-6 text-center text-sm text-destructive">
          Nested remote failed to load. Confirm the child remote build is being served.
        </div>
      ) : null}
      <div ref={containerRef} />
    </section>
  );
}

function HeroMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-lg border-sky-300 bg-slate-950 text-white shadow-sm md:col-span-2">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-sky-500">{icon}</div>
        <CardDescription className="text-sky-200">{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-sky-100">Line cooks see this count before firing the next wave.</p>
      </CardContent>
    </Card>
  );
}

function Build({ name, layers, risk }: { name: string; layers: string; risk: string }) {
  return (
    <Card className="rounded-lg border-border bg-white shadow-sm">
      <CardHeader>
        <CardDescription>{risk}</CardDescription>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{layers}</p>
      </CardContent>
    </Card>
  );
}

function Panel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="rounded-lg border-border bg-white shadow-sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl text-slate-950">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function useApiData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;

    setStatus("loading");
    fetch(`${apiBaseUrl}${path}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        return response.json() as Promise<T>;
      })
      .then((nextData) => {
        if (!disposed) {
          setData(nextData);
          setStatus("ready");
        }
      })
      .catch((error) => {
        console.error(error);
        if (!disposed) {
          setStatus("error");
        }
      });

    return () => {
      disposed = true;
    };
  }, [path]);

  return { data, status };
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

function joinBasename(parentBasename: string | undefined, childPath: string) {
  const normalizedParent = parentBasename && parentBasename !== "/" ? parentBasename.replace(/\/$/, "") : "";
  return `${normalizedParent}/${childPath}`;
}
