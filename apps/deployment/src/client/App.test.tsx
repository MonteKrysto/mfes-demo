import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { App } from "./App";

test("renders deployment heading", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/remotes") {
        return Response.json({ remotes: [] });
      }

      if (url === "/api/environments") {
        return Response.json({ environments: [] });
      }

      if (url === "/api/storage/containers") {
        return Response.json({ configuredContainer: "mfe-artifacts", containers: [{ name: "mfe-artifacts", lastModified: null }] });
      }

      if (url === "/api/storage/containers/mfe-artifacts/blobs") {
        return Response.json({ container: "mfe-artifacts", prefix: "", directories: [], blobs: [] });
      }

      return Response.json({ versions: [] });
    })
  );

  render(<App />);

  expect(await screen.findByText("Micro frontend releases")).toBeInTheDocument();
});
