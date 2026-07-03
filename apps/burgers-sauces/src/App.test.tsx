import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        railStatus: "Battle ready",
        sauces: [{ name: "Shield Sauce", level: "92%", detail: "Pepper mayo." }]
      })
    )
  );
});

test("renders API-backed sauce data", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Shield Sauce")).toBeInTheDocument());
});
