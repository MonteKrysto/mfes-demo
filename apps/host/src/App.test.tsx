import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  const remoteEntryUrl = `data:text/javascript,${encodeURIComponent(
    "export async function init(){} export async function get(){ return () => ({ mount: () => ({ unmount(){} }) }); }"
  )}`;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/host/status")) {
        return Response.json({
          environment: "local",
          activeRemotes: ["frodos-franks", "boromirs-burgers"]
        });
      }

      if (url.includes("/assets/remoteEntry.js")) {
        return Response.redirect(remoteEntryUrl);
      }

      return Response.json({ environment: "dev", remotes: {} });
    })
  );
});

test("renders the empty host state", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getAllByText("Select somewhere to eat")[0]).toBeInTheDocument();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
});

test("renders a selected remote shell heading in local integration mode", async () => {
  render(
    <MemoryRouter initialEntries={["/boromirs-burgers"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "Boromirs Burgers" })).toBeInTheDocument();
  await waitFor(() => expect(fetch).toHaveBeenCalledWith("http://localhost:6073/api/host/status"));
  expect(fetch).not.toHaveBeenCalledWith("http://localhost:5050/api/environments/dev/host-manifest");
});
