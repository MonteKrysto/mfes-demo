import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/builds")) {
        return Response.json({
          builds: [{ name: "The Horn Burger", layers: "Double patty", risk: "Messy" }]
        });
      }

      return Response.json({
        pattiesOnDeck: 42,
        panels: [{ title: "Char station", value: "7 min", detail: "Average ticket time" }]
      });
    })
  );
});

test("renders the grill route", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Grill command")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
});

test("renders the builds route", async () => {
  render(
    <MemoryRouter initialEntries={["/builds"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Burger builds")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("The Horn Burger")).toBeInTheDocument());
});
