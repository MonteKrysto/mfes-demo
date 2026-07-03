import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());

export const providerResponses = {
  "/api/shire-sides/sides": {
    station: "Shire sides pantry",
    items: [
      { name: "Samwise Salt Potatoes", count: "38 bowls", note: "Parsley butter, coarse salt, warm hold." },
      { name: "Green Dragon Slaw", count: "24 cups", note: "Cabbage, apple, cider dressing." },
      { name: "Mushroom Skewers", count: "18 trays", note: "Roasted mushrooms with garlic oil." }
    ]
  },
  "/api/shire-sides/prep": {
    tasks: [
      { title: "Slice buns", value: "Done", detail: "Six trays wrapped for lunch service." },
      { title: "Chill slaw", value: "12 min", detail: "Holding at temp before counter fill." },
      { title: "Pack sauces", value: "84", detail: "Single-serve cups ready for catering." }
    ]
  }
} as const;

app.get("/api/shire-sides/sides", (_request, response) => {
  response.json(providerResponses["/api/shire-sides/sides"]);
});

app.get("/api/shire-sides/prep", (_request, response) => {
  response.json(providerResponses["/api/shire-sides/prep"]);
});
