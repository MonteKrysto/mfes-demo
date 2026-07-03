import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.FRANKS_SIDES_API_PORT ?? 6077);

app.use(cors());

app.get("/api/shire-sides/sides", (_request, response) => {
  response.json({
    station: "Shire sides pantry",
    items: [
      { name: "Samwise Salt Potatoes", count: "38 bowls", note: "Parsley butter, coarse salt, warm hold." },
      { name: "Green Dragon Slaw", count: "24 cups", note: "Cabbage, apple, cider dressing." },
      { name: "Mushroom Skewers", count: "18 trays", note: "Roasted mushrooms with garlic oil." }
    ]
  });
});

app.get("/api/shire-sides/prep", (_request, response) => {
  response.json({
    tasks: [
      { title: "Slice buns", value: "Done", detail: "Six trays wrapped for lunch service." },
      { title: "Chill slaw", value: "12 min", detail: "Holding at temp before counter fill." },
      { title: "Pack sauces", value: "84", detail: "Single-serve cups ready for catering." }
    ]
  });
});

app.listen(port, () => {
  console.log(`Shire Sides API listening on http://localhost:${port}`);
});
