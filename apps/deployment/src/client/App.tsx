import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Cloud, ExternalLink, FileText, Folder, RefreshCw, Rocket, Settings2 } from "lucide-react";
import {
  getEnvironments,
  getRemotes,
  getRemoteVersions,
  getStorageContainers,
  getStorageListing,
  promoteRemote,
  setEnvironmentRemote,
  setupStorage,
  type EnvironmentManifest,
  type RemoteDefinition,
  type RemoteVersion,
  type StorageBlob,
  type StorageContainer,
  type StorageListing
} from "./api";

type VersionsByRemote = Record<string, RemoteVersion[]>;

export function App() {
  const [remotes, setRemotes] = useState<RemoteDefinition[]>([]);
  const [versions, setVersions] = useState<VersionsByRemote>({});
  const [environments, setEnvironments] = useState<EnvironmentManifest[]>([]);
  const [storageContainers, setStorageContainers] = useState<StorageContainer[]>([]);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [storageListing, setStorageListing] = useState<StorageListing | null>(null);
  const [storagePreview, setStoragePreview] = useState<{ path: string; content: string } | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const remoteResult = await getRemotes();
    const [environmentResult, versionPairs] = await Promise.all([
      getEnvironments(),
      Promise.all(remoteResult.remotes.map(async (remote) => [remote.id, (await getRemoteVersions(remote.id)).versions] as const))
    ]);

    setRemotes(remoteResult.remotes);
    setEnvironments(environmentResult.environments);
    setVersions(Object.fromEntries(versionPairs));
    await refreshStorage(selectedContainer, storageListing?.prefix ?? "");
  }

  useEffect(() => {
    Promise.all([refresh(), refreshStorage()]).catch((refreshError: unknown) =>
      setError(refreshError instanceof Error ? refreshError.message : "Failed to load deployment state")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestByRemote = useMemo(
    () => Object.fromEntries(Object.entries(versions).map(([remoteId, items]) => [remoteId, items[0]])),
    [versions]
  );

  async function run(label: string, action: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(label);
    setError(null);

    try {
      await action();
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Deployment action failed");
    } finally {
      setBusy(null);
    }
  }

  async function refreshStorage(containerName = selectedContainer, prefix = storageListing?.prefix ?? "") {
    const containerResult = await getStorageContainers();
    const nextContainer =
      containerName || containerResult.configuredContainer || containerResult.containers[0]?.name || "";

    setStorageContainers(containerResult.containers);
    setSelectedContainer(nextContainer);

    if (!nextContainer) {
      setStorageListing(null);
      setStoragePreview(null);
      return;
    }

    setStorageListing(await getStorageListing(nextContainer, prefix));
    setStoragePreview(null);
  }

  async function previewBlob(blob: StorageBlob) {
    const response = await fetch(storageBlobUrl(blob.path));

    if (!response.ok) {
      throw new Error(`Unable to load ${blob.path}`);
    }

    const text = await response.text();
    const truncated = text.length > 12000 ? `${text.slice(0, 12000)}\n\n... preview truncated ...` : text;
    setStoragePreview({ path: blob.path, content: truncated });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Azure local deployment control</p>
            <h1 className="text-2xl font-semibold tracking-normal">Micro frontend releases</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => run("setup", setupStorage)}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              {busy === "setup" ? "Setting up..." : "Setup Storage"}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => run("refresh", refresh)}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {busy === "refresh" ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5">
        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {remotes.map((remote) => (
            <article key={remote.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{remote.packageName}</p>
                  <h2 className="text-xl font-semibold">{remote.displayName}</h2>
                </div>
                <div className="rounded-md bg-blue-50 p-2 text-blue-700">
                  <Boxes className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {(versions[remote.id] ?? []).length ? (
                  (versions[remote.id] ?? []).slice(0, 4).map((version) => (
                    <div key={version.version} className="grid gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <div className="font-medium">{version.version}</div>
                      <div className="text-slate-500">
                        {version.branch} · {version.sha} · {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500">
                    No saved versions. Publish with `pnpm --filter deployment publish:remote {remote.packageName}`.
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold">Environment mappings</h2>
              <p className="text-sm text-slate-500">Each mapping updates the runtime manifest consumed by the host.</p>
            </div>
            <Cloud className="h-5 w-5 text-blue-700" aria-hidden="true" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Environment</th>
                  {remotes.map((remote) => (
                    <th key={remote.id} className="px-4 py-3">{remote.displayName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {environments.map((environment) => (
                  <tr key={environment.environment} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-4 font-semibold">{environment.environment}</td>
                    {remotes.map((remote) => {
                      const current = environment.remotes[remote.id];
                      const selectionKey = `${environment.environment}:${remote.id}`;
                      const selectedVersion = selectedVersions[selectionKey] ?? current?.version ?? versions[remote.id]?.[0]?.version ?? "";
                      const setActionKey = `set-${environment.environment}-${remote.id}`;
                      const latestProdActionKey = `latest-prod-${remote.id}`;

                      return (
                        <td key={remote.id} className="px-4 py-4">
                          <div className="grid gap-2">
                            <div className="text-sm font-medium">{current?.version ?? "Not assigned"}</div>
                            <select
                              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                              value={selectedVersion}
                              onChange={(event) => setSelectedVersions((state) => ({ ...state, [selectionKey]: event.target.value }))}
                            >
                              {(versions[remote.id] ?? []).map((version) => (
                                <option key={version.version} value={version.version}>
                                  {version.version}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-medium"
                                disabled={!selectedVersion || busy !== null}
                                onClick={() =>
                                  run(setActionKey, () =>
                                    setEnvironmentRemote(environment.environment, remote.id, selectedVersion)
                                  )
                                }
                              >
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                {busy === setActionKey ? "Setting..." : "Set"}
                              </button>
                              {environment.environment === "prod" ? (
                                <button
                                  type="button"
                                  className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-700 px-2 text-xs font-medium text-white disabled:opacity-50"
                                  disabled={!latestByRemote[remote.id] || busy !== null}
                                  onClick={() =>
                                    run(latestProdActionKey, () =>
                                      promoteRemote({ remoteId: remote.id, toEnvironment: "prod", version: latestByRemote[remote.id]?.version })
                                    )
                                  }
                                >
                                  <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                                  {busy === latestProdActionKey ? "Promoting..." : "Latest to prod"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Azurite storage browser</h2>
              <p className="text-sm text-slate-500">Inspect blob containers and the remote artifacts stored by fake CI.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={selectedContainer}
                onChange={(event) => {
                  const nextContainer = event.target.value;
                  setSelectedContainer(nextContainer);
                  refreshStorage(nextContainer, "").catch((storageError: unknown) =>
                    setError(storageError instanceof Error ? storageError.message : "Failed to load storage")
                  );
                }}
              >
                {storageContainers.map((container) => (
                  <option key={container.name} value={container.name}>
                    {container.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-50"
                disabled={busy !== null}
                onClick={() => run("storage-refresh", () => refreshStorage())}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {busy === "storage-refresh" ? "Refreshing..." : "Refresh Storage"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
            <div className="min-w-0">
              <StorageBreadcrumbs
                prefix={storageListing?.prefix ?? ""}
                onOpen={(prefix) =>
                  refreshStorage(selectedContainer, prefix).catch((storageError: unknown) =>
                    setError(storageError instanceof Error ? storageError.message : "Failed to load storage")
                  )
                }
              />
              <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Modified</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageListing?.directories.map((directory) => (
                      <tr key={directory.path} className="border-t border-slate-200">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="inline-flex min-w-0 items-center gap-2 font-medium text-blue-700"
                            onClick={() =>
                              refreshStorage(selectedContainer, directory.path).catch((storageError: unknown) =>
                                setError(storageError instanceof Error ? storageError.message : "Failed to load storage")
                              )
                            }
                          >
                            <Folder className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{directory.name}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-500">Folder</td>
                        <td className="px-3 py-2 text-slate-500">-</td>
                        <td className="px-3 py-2 text-slate-500">-</td>
                        <td className="px-3 py-2 text-slate-500">-</td>
                      </tr>
                    ))}
                    {storageListing?.blobs.map((blob) => (
                      <tr key={blob.path} className="border-t border-slate-200 align-top">
                        <td className="max-w-[280px] px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                            <span className="truncate font-medium">{blob.name}</span>
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">{blob.path}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{blob.contentType ?? "application/octet-stream"}</td>
                        <td className="px-3 py-2 text-slate-500">{formatBytes(blob.size)}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {blob.lastModified ? new Date(blob.lastModified).toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="h-8 rounded-md border border-slate-300 px-2 text-xs font-medium"
                              onClick={() =>
                                run(`preview-${blob.path}`, () => previewBlob(blob))
                              }
                            >
                              Preview
                            </button>
                            <a
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-medium"
                              href={storageBlobUrl(blob.path)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                              Open
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {storageListing && !storageListing.directories.length && !storageListing.blobs.length ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                          No blobs found in this path.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="min-w-0 rounded-md border border-slate-200 bg-slate-950 text-slate-50">
              <div className="border-b border-slate-800 px-3 py-2 text-sm font-medium">
                {storagePreview?.path ?? "Preview"}
              </div>
              <pre className="max-h-[420px] overflow-auto p-3 text-xs leading-5 text-slate-100">
                {storagePreview?.content ?? "Select a blob to preview JSON, CSS, JavaScript, or manifest content."}
              </pre>
            </aside>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Promote environment</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <select id="remote" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
              {remotes.map((remote) => (
                <option key={remote.id} value={remote.id}>{remote.displayName}</option>
              ))}
            </select>
            <select id="fromEnvironment" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm">
              {environments.map((environment) => (
                <option key={environment.environment} value={environment.environment}>{environment.environment}</option>
              ))}
            </select>
            <select id="toEnvironment" className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm" defaultValue="prod">
              {environments.map((environment) => (
                <option key={environment.environment} value={environment.environment}>{environment.environment}</option>
              ))}
            </select>
            <button
              type="button"
              className="h-10 rounded-md bg-slate-950 px-3 text-sm font-medium text-white disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => {
                const remoteId = (document.getElementById("remote") as HTMLSelectElement).value;
                const fromEnvironment = (document.getElementById("fromEnvironment") as HTMLSelectElement).value;
                const toEnvironment = (document.getElementById("toEnvironment") as HTMLSelectElement).value;
                run(`promote-${remoteId}`, () => promoteRemote({ remoteId, fromEnvironment, toEnvironment }));
              }}
            >
              Promote
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function StorageBreadcrumbs({
  prefix,
  onOpen
}: {
  prefix: string;
  onOpen: (prefix: string) => void;
}) {
  const parts = prefix.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => ({
    name: part,
    path: `${parts.slice(0, index + 1).join("/")}/`
  }));

  return (
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <button type="button" className="rounded-md border border-slate-300 px-2 py-1 font-medium" onClick={() => onOpen("")}>
        root
      </button>
      {crumbs.map((crumb) => (
        <button
          key={crumb.path}
          type="button"
          className="rounded-md border border-slate-300 px-2 py-1 font-medium"
          onClick={() => onOpen(crumb.path)}
        >
          {crumb.name}
        </button>
      ))}
    </div>
  );
}

function storageBlobUrl(path: string) {
  return `/storage/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
