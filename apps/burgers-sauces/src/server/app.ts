import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());

export const providerResponses = {
  "/api/gondor-sauces/sauces": {
    railStatus: "Battle ready",
    sauces: [
      { name: "Shield Sauce", level: "92%", detail: "Pepper mayo, smoked paprika, pickle brine." },
      { name: "White City Aioli", level: "68%", detail: "Garlic, lemon, cracked black pepper." },
      { name: "Steward Mustard", level: "81%", detail: "Stone-ground mustard with honey heat." }
    ]
  },
  "/api/gondor-sauces/batches": {
    batches: [
      { title: "Morning mix", value: "Passed", detail: "Taste check logged by grill lead." },
      { title: "Backup tubs", value: "5", detail: "Cold storage tubs labeled for dinner." },
      { title: "Allergen cards", value: "Current", detail: "Printed cards match today's recipes." }
    ]
  }
} as const;

app.get("/api/gondor-sauces/sauces", (_request, response) => {
  response.json(providerResponses["/api/gondor-sauces/sauces"]);
});

app.get("/api/gondor-sauces/batches", (_request, response) => {
  response.json(providerResponses["/api/gondor-sauces/batches"]);
});
