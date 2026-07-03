import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.BURGERS_SAUCES_API_PORT ?? 6078);

app.use(cors());

app.get("/api/gondor-sauces/sauces", (_request, response) => {
  response.json({
    railStatus: "Battle ready",
    sauces: [
      { name: "Shield Sauce", level: "92%", detail: "Pepper mayo, smoked paprika, pickle brine." },
      { name: "White City Aioli", level: "68%", detail: "Garlic, lemon, cracked black pepper." },
      { name: "Steward Mustard", level: "81%", detail: "Stone-ground mustard with honey heat." }
    ]
  });
});

app.get("/api/gondor-sauces/batches", (_request, response) => {
  response.json({
    batches: [
      { title: "Morning mix", value: "Passed", detail: "Taste check logged by grill lead." },
      { title: "Backup tubs", value: "5", detail: "Cold storage tubs labeled for dinner." },
      { title: "Allergen cards", value: "Current", detail: "Printed cards match today's recipes." }
    ]
  });
});

app.listen(port, () => {
  console.log(`Gondor Sauces API listening on http://localhost:${port}`);
});
