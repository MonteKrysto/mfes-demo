import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());

export const providerResponses = {
  "/api/burgers/grill": {
    pattiesOnDeck: 42,
    panels: [
      { title: "Char station", value: "7 min", detail: "Average ticket time" },
      { title: "Sauce rail", value: "Stocked", detail: "All house sauces above par" },
      { title: "Hold bin", value: "12", detail: "Ready for assembly" },
      { title: "Fryer", value: "3 min", detail: "Average fry time" },
      { title: "Bun warmer", value: "Hot", detail: "All buns at 160°F" },
      { title: "Grill temp", value: "375°F", detail: "Optimal sear temperature" },
      { title: "Staffing", value: "3", detail: "Two grillers, one runner" },
    ]
  },
  "/api/burgers/builds": {
    builds: [
      { name: "The Horn Burger", layers: "Double patty, smoked cheddar, onion jam", risk: "Messy" },
      { name: "Steward Stack", layers: "Single patty, sharp pickles, shield sauce", risk: "Fast" },
      { name: "White City Melt", layers: "Swiss, mushrooms, grilled onions", risk: "Hot" }
    ]
  },
  "/api/burgers/orders": {
    panels: [
      { title: "Dine-in", value: "16", detail: "Six orders firing now" },
      { title: "Pickup", value: "9", detail: "Four ready at the counter" },
      { title: "Delivery", value: "13", detail: "Drivers arriving in sequence" },
      { title: "Comped", value: "1", detail: "Manager approval logged" }
    ]
  },
  "/api/burgers/loyalty": {
    rewardClaims: 128,
    panels: [
      { title: "Top perk", value: "Free fries", detail: "38 claims this week" },
      { title: "New members", value: "54", detail: "Joined from receipt QR" },
      { title: "Win-back", value: "21%", detail: "Recovered dormant guests" }
    ]
  }
} as const;

app.get("/api/burgers/grill", (_request, response) => {
  response.json(providerResponses["/api/burgers/grill"]);
});

app.get("/api/burgers/builds", (_request, response) => {
  response.json(providerResponses["/api/burgers/builds"]);
});

app.get("/api/burgers/orders", (_request, response) => {
  response.json(providerResponses["/api/burgers/orders"]);
});

app.get("/api/burgers/loyalty", (_request, response) => {
  response.json(providerResponses["/api/burgers/loyalty"]);
});
