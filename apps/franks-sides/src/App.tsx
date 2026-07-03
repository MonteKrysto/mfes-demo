import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ClipboardCheck, Home, PackageCheck, Soup } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SideItem = {
  name: string;
  count: string;
  note: string;
};

type PrepTask = {
  title: string;
  value: string;
  detail: string;
};

type SidesResponse = {
  station: string;
  items: SideItem[];
};

type PrepResponse = {
  tasks: PrepTask[];
};

const localApiBaseUrl = import.meta.env.VITE_SHIRE_SIDES_API_URL ?? "http://localhost:6077/api";
const ApiBaseUrlContext = createContext(localApiBaseUrl);

const navItems = [
  { to: "/", label: "Sides", icon: Home },
  { to: "/prep", label: "Prep", icon: ClipboardCheck }
];

export function App({ apiBaseUrl }: { apiBaseUrl?: string }) {
  return (
    <ApiBaseUrlContext.Provider value={apiBaseUrl ?? localApiBaseUrl}>
    <section className="min-h-screen bg-amber-50 text-stone-950">
      <header className="border-b border-amber-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-700 text-white">
              <Soup className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Nested remote</p>
              <h1 className="text-2xl font-bold">Shire Sides</h1>
            </div>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white", isActive && "bg-emerald-50 text-emerald-900")
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
        <Route path="/" element={<Sides />} />
        <Route path="/prep" element={<Prep />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </section>
    </ApiBaseUrlContext.Provider>
  );
}

function Sides() {
  const { data, status } = useApiData<SidesResponse>("/shire-sides/sides");

  return (
    <Page title="Side station" subtitle={data?.station ?? "Loading side station data..."} status={status}>
      {(data?.items ?? []).map((item) => (
        <Card key={item.name} className="rounded-lg border-amber-200 bg-white shadow-sm">
          <CardHeader>
            <CardDescription>{item.count}</CardDescription>
            <CardTitle className="text-lg text-stone-950">{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
          </CardContent>
        </Card>
      ))}
    </Page>
  );
}

function Prep() {
  const { data, status } = useApiData<PrepResponse>("/shire-sides/prep");

  return (
    <Page title="Prep board" subtitle="Kitchen tasks fetched from the Shire Sides API." status={status}>
      {(data?.tasks ?? []).map((task) => (
        <Card key={task.title} className="rounded-lg border-amber-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-700 text-white">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardDescription>{task.title}</CardDescription>
            <CardTitle className="text-2xl text-stone-950">{task.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{task.detail}</p>
          </CardContent>
        </Card>
      ))}
    </Page>
  );
}

function Page({ title, subtitle, status, children }: { title: string; subtitle: string; status: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Shire Sides API</p>
      <h2 className="mt-1 text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      {status === "error" ? <p className="mt-5 text-sm text-destructive">Unable to load side station data.</p> : null}
      {status === "loading" ? <p className="mt-5 text-sm text-muted-foreground">Loading...</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-3">{children}</div>
    </main>
  );
}

function useApiData<T>(path: string) {
  const apiBaseUrl = useContext(ApiBaseUrlContext);
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
  }, [apiBaseUrl, path]);

  return { data, status };
}
