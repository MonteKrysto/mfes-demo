import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.HOST_API_PORT ?? 6073);

app.use(cors());

app.get("/api/host/status", (_request, response) => {
  response.json({
    name: "MFE Host",
    environment: process.env.HOST_ENVIRONMENT ?? "local",
    activeRemotes: ["frodos-franks", "boromirs-burgers"],
    updatedAt: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Host API listening on http://localhost:${port}`);
});
