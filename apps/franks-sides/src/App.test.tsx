import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        station: "Shire sides pantry",
        items: [{ name: "Samwise Salt Potatoes", count: "38 bowls", note: "Parsley butter." }]
      })
    )
  );
});

test("renders API-backed side data", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Samwise Salt Potatoes")).toBeInTheDocument());
});
