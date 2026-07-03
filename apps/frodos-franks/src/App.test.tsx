import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/orders")) {
        return Response.json({
          readyNow: 6,
          tickets: [{ title: "#1042", value: "Wrapping", detail: "2 Fellowship Franks" }]
        });
      }

      return Response.json({
        rushWindow: "11:30-2:00",
        averageServiceTime: "4 min",
        items: [{ name: "The Fellowship Frank", price: "$8", detail: "Quest sauce." }]
      });
    })
  );
});

test("renders the menu route", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Signature franks")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("The Fellowship Frank")).toBeInTheDocument());
});

test("renders the orders route", async () => {
  render(
    <MemoryRouter initialEntries={["/orders"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Current cart queue")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Wrapping")).toBeInTheDocument());
});
