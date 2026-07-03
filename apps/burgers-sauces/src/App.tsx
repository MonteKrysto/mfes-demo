import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Beaker, ClipboardCheck, Home, ShieldCheck } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Sauce = {
  name: string;
  level: string;
  detail: string;
};

type Batch = {
  title: string;
  value: string;
  detail: string;
};

type SaucesResponse = {
  railStatus: string;
  sauces: Sauce[];
};

type BatchesResponse = {
  batches: Batch[];
};

const localApiBaseUrl = import.meta.env.VITE_GONDOR_SAUCES_API_URL ?? "http://localhost:6078/api";
const ApiBaseUrlContext = createContext(localApiBaseUrl);

const navItems = [
  { to: "/", label: "Rail", icon: Home },
  { to: "/batches", label: "Batches", icon: ClipboardCheck }
];

export function App({ apiBaseUrl }: { apiBaseUrl?: string }) {
  return (
    <ApiBaseUrlContext.Provider value={apiBaseUrl ?? localApiBaseUrl}>
    <section className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-yellow-500 text-zinc-950">
              <Beaker className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">Nested remote</p>
              <h1 className="text-2xl font-bold">Gondor Sauces</h1>
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
                    cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800 hover:text-white",
                      isActive && "border-yellow-400 bg-yellow-500 text-zinc-950 hover:bg-yellow-500 hover:text-zinc-950"
                    )
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
        <Route path="/" element={<Rail />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </section>
    </ApiBaseUrlContext.Provider>
  );
}

function Rail() {
  const { data, status } = useApiData<SaucesResponse>("/gondor-sauces/sauces");

  return (
    <Page title="Sauce rail" subtitle={data?.railStatus ?? "Loading sauce rail data..."} status={status}>
      {(data?.sauces ?? []).map((sauce) => (
        <Card key={sauce.name} className="rounded-lg border-zinc-800 bg-zinc-900 text-white shadow-sm">
          <CardHeader>
            <CardDescription className="text-yellow-200">{sauce.level}</CardDescription>
            <CardTitle className="text-lg">{sauce.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-zinc-300">{sauce.detail}</p>
          </CardContent>
        </Card>
      ))}
    </Page>
  );
}

function Batches() {
  const { data, status } = useApiData<BatchesResponse>("/gondor-sauces/batches");

  return (
    <Page title="Batch checks" subtitle="Quality checks fetched from the Gondor Sauces API." status={status}>
      {(data?.batches ?? []).map((batch) => (
        <Card key={batch.title} className="rounded-lg border-zinc-800 bg-zinc-900 text-white shadow-sm">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-500 text-zinc-950">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardDescription className="text-zinc-300">{batch.title}</CardDescription>
            <CardTitle className="text-2xl">{batch.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-zinc-300">{batch.detail}</p>
          </CardContent>
        </Card>
      ))}
    </Page>
  );
}

function Page({ title, subtitle, status, children }: { title: string; subtitle: string; status: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">Gondor Sauces API</p>
      <h2 className="mt-1 text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{subtitle}</p>
      {status === "error" ? <p className="mt-5 text-sm text-red-300">Unable to load sauce data.</p> : null}
      {status === "loading" ? <p className="mt-5 text-sm text-zinc-300">Loading...</p> : null}
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
