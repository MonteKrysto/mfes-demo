import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, ChefHat, ClipboardList, Clock, Home, MapPin, PackageOpen, Star } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AppProps = {
  basename?: string;
  remoteEntries?: Record<string, { version: string; remoteEntryUrl: string }>;
};

type MenuItem = {
  name: string;
  price: string;
  detail: string;
};

type StatusItem = {
  title: string;
  value: string;
  detail: string;
};

type MenuResponse = {
  rushWindow: string;
  averageServiceTime: string;
  items: MenuItem[];
};

type OrdersResponse = {
  readyNow: number;
  tickets: StatusItem[];
};

type LocationsResponse = {
  bestStop: string;
  selloutForecast: string;
  stops: StatusItem[];
};

type CateringResponse = {
  openSlots: number;
  packages: MenuItem[];
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

const apiBaseUrl = import.meta.env.VITE_FRODOS_API_URL ?? "http://localhost:6074/api";
const shireSidesRemoteEntryUrl = import.meta.env.VITE_SHIRE_SIDES_REMOTE_ENTRY_URL ?? "http://localhost:5177/assets/remoteEntry.js";

const navItems = [
  { to: "/", label: "Menu", icon: Home },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/catering", label: "Catering", icon: CalendarDays },
  { to: "/shire-sides", label: "Shire Sides", icon: PackageOpen }
];

export function App({ basename, remoteEntries }: AppProps) {
  const shireSidesEntryUrl = remoteEntries?.["shire-sides"]?.remoteEntryUrl ?? shireSidesRemoteEntryUrl;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-4 border-red-600 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Remote host</p>
            <h1 className="text-3xl font-bold text-red-950">Frodos Franks</h1>
            <p className="text-sm text-muted-foreground">Tiny carts, big quests, fast lunches.</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(buttonVariants({ variant: "outline", size: "sm" }), isActive && "bg-red-50 text-red-900")
                  }
                >
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/catering" element={<Catering />} />
        <Route
          path="/shire-sides/*"
          element={<NestedRemote name="Shire Sides" remoteEntryUrl={shireSidesEntryUrl} basename={joinBasename(basename, "shire-sides")} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function Menu() {
  const { data, status } = useApiData<MenuResponse>("/franks/menu");

  return (
    <PageShell
      eyebrow="Cart menu"
      title="Signature franks"
      status={status}
      aside={<Feature title="Lunch rush" value={data?.rushWindow ?? "..."} detail={`Counter service average is ${data?.averageServiceTime ?? "loading"}.`} />}
    >
      {(data?.items ?? []).map((item) => (
        <MenuCard key={item.name} name={item.name} price={item.price} detail={item.detail} />
      ))}
    </PageShell>
  );
}

function Orders() {
  const { data, status } = useApiData<OrdersResponse>("/franks/orders");

  return (
    <PageShell
      eyebrow="Order board"
      title="Current cart queue"
      status={status}
      aside={<Feature title="Ready now" value={String(data?.readyNow ?? "...")} detail="Pickup bags and walk-up trays fetched from the Franks API." />}
    >
      {(data?.tickets ?? []).map((ticket, index) => (
        <StatusCard key={ticket.title} icon={orderIcons[index] ?? <Clock className="h-5 w-5" />} title={ticket.title} value={ticket.value} detail={ticket.detail} />
      ))}
    </PageShell>
  );
}

function Locations() {
  const { data, status } = useApiData<LocationsResponse>("/franks/locations");

  return (
    <PageShell
      eyebrow="Cart route"
      title="Today around town"
      status={status}
      aside={<Feature title="Best stop" value={data?.bestStop ?? "..."} detail={`Expected to sell out by ${data?.selloutForecast ?? "loading"}.`} />}
    >
      {(data?.stops ?? []).map((stop) => (
        <StatusCard key={stop.title} icon={<MapPin className="h-5 w-5" />} title={stop.title} value={stop.value} detail={stop.detail} />
      ))}
    </PageShell>
  );
}

function Catering() {
  const { data, status } = useApiData<CateringResponse>("/franks/catering");

  return (
    <PageShell
      eyebrow="Events"
      title="Franks for a crowd"
      status={status}
      aside={<Feature title="Open slots" value={String(data?.openSlots ?? "...")} detail="Available catering windows this week." />}
    >
      {(data?.packages ?? []).map((item) => (
        <MenuCard key={item.name} name={item.name} price={item.price} detail={item.detail} />
      ))}
    </PageShell>
  );
}

function PageShell({
  eyebrow,
  title,
  status,
  aside,
  children
}: {
  eyebrow: string;
  title: string;
  status: string;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_18rem]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-bold">{title}</h2>
        {status === "loading" ? <p className="mt-5 text-sm text-muted-foreground">Loading Franks API data...</p> : null}
        {status === "error" ? <p className="mt-5 text-sm text-destructive">Unable to load Franks API data.</p> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-3">{children}</div>
      </section>
      <aside>{aside}</aside>
    </main>
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

function MenuCard({ name, price, detail }: { name: string; price: string; detail: string }) {
  return (
    <Card className="rounded-lg border-red-200 bg-white shadow-sm">
      <CardHeader>
        <CardDescription>{price}</CardDescription>
        <CardTitle className="text-xl text-red-950">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function StatusCard({ icon, title, value, detail }: { icon: ReactNode; title: string; value: string; detail: string }) {
  return (
    <Card className="rounded-lg border-red-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-200 text-red-950">{icon}</div>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl text-red-950">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Feature({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="rounded-lg border-red-300 bg-red-700 text-white shadow-sm">
      <CardHeader>
        <CardDescription className="text-red-100">{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-red-100">{detail}</p>
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

const orderIcons = [<Clock className="h-5 w-5" />, <ChefHat className="h-5 w-5" />, <Star className="h-5 w-5" />];
