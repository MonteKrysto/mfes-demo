import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());

export const providerResponses = {
  "/api/franks/menu": {
    rushWindow: "11:30-2:00",
    averageServiceTime: "4 min",
    items: [
      { name: "The Fellowship Frank", price: "$8", detail: "Beef frank, pickle relish, crispy onions, quest sauce." },
      { name: "Mordor Heat", price: "$9", detail: "Charred chili, jalapeno coins, smoked paprika mustard." },
      { name: "Garden Shire", price: "$7", detail: "Veggie frank, herb slaw, cucumber, bright tomato jam." },
      { name: "Rivendell Classic", price: "$8", detail: "Beef frank, cheddar, caramelized onions, garlic aioli." },
      { name: "Gondor Dog", price: "$9", detail: "Beef frank, smoked gouda, bacon, roasted garlic ketchup." },
      { name: "Rohan Rider", price: "$8", detail: "Beef frank, pepper jack, jalapeno bacon, chipotle mayo." },
      { name: "Entwood Special", price: "$7", detail: "Veggie frank, roasted mushrooms, arugula, truffle aioli." },
      { name: "Isengard Inferno", price: "$10", detail: "Beef frank, ghost pepper sauce, habanero slaw, fried onions." },
      { name: "Lothlorien Light", price: "$7", detail: "Veggie frank, lemon herb sauce, fresh herbs, microgreens." },
      { name: "Dwarven Delight", price: "$9", detail: "Beef frank, smoked cheddar, caramelized onions, stout mustard." }
    ]
  },
  "/api/franks/orders": {
    readyNow: 6,
    tickets: [
      { title: "#1042", value: "Wrapping", detail: "2 Fellowship Franks, 1 lemonade" },
      { title: "#1043", value: "On grill", detail: "Mordor Heat with extra chili" },
      { title: "#1044", value: "VIP", detail: "Garden Shire catering sampler" }
    ]
  },
  "/api/franks/locations": {
    bestStop: "Market Row",
    selloutForecast: "1:45 PM",
    stops: [
      { title: "Market Row", value: "Open", detail: "10:30 AM - 2:00 PM" },
      { title: "North Square", value: "Next", detail: "3:00 PM - 6:00 PM" },
      { title: "Riverside Lawn", value: "Weekend", detail: "Saturday pop-up service" }
    ]
  },
  "/api/franks/catering": {
    openSlots: 4,
    packages: [
      { name: "Second Breakfast Tray", price: "$96", detail: "Twelve assorted franks with chips and sauces." },
      { name: "Council Combo", price: "$180", detail: "Twenty-four franks, two sides, bottled drinks." },
      { name: "Quest Cart", price: "$420", detail: "Full-service cart for two hours, up to 80 guests." }
    ]
  }
} as const;

app.get("/api/franks/menu", (_request, response) => {
  response.json(providerResponses["/api/franks/menu"]);
});

app.get("/api/franks/orders", (_request, response) => {
  response.json(providerResponses["/api/franks/orders"]);
});

app.get("/api/franks/locations", (_request, response) => {
  response.json(providerResponses["/api/franks/locations"]);
});

app.get("/api/franks/catering", (_request, response) => {
  response.json(providerResponses["/api/franks/catering"]);
});
