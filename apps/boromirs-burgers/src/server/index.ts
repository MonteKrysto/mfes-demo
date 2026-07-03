import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.BOROMIRS_API_PORT ?? 6075);

app.use(cors());

app.get("/api/burgers/grill", (_request, response) => {
  response.json({
    pattiesOnDeck: 42,
    panels: [
      { title: "Char station", value: "7 min", detail: "Average ticket time" },
      { title: "Sauce rail", value: "Stocked", detail: "All house sauces above par" },
      { title: "Hold bin", value: "12", detail: "Ready for assembly" }
    ]
  });
});

app.get("/api/burgers/builds", (_request, response) => {
  response.json({
    builds: [
      { name: "The Horn Burger", layers: "Double patty, smoked cheddar, onion jam", risk: "Messy" },
      { name: "Steward Stack", layers: "Single patty, sharp pickles, shield sauce", risk: "Fast" },
      { name: "White City Melt", layers: "Swiss, mushrooms, grilled onions", risk: "Hot" }
    ]
  });
});

app.get("/api/burgers/orders", (_request, response) => {
  response.json({
    panels: [
      { title: "Dine-in", value: "16", detail: "Six orders firing now" },
      { title: "Pickup", value: "9", detail: "Four ready at the counter" },
      { title: "Delivery", value: "13", detail: "Drivers arriving in sequence" },
      { title: "Comped", value: "1", detail: "Manager approval logged" }
    ]
  });
});

app.get("/api/burgers/loyalty", (_request, response) => {
  response.json({
    rewardClaims: 128,
    panels: [
      { title: "Top perk", value: "Free fries", detail: "38 claims this week" },
      { title: "New members", value: "54", detail: "Joined from receipt QR" },
      { title: "Win-back", value: "21%", detail: "Recovered dormant guests" }
    ]
  });
});

app.listen(port, () => {
  console.log(`Boromirs Burgers API listening on http://localhost:${port}`);
});
