import { app } from "./app";

const port = Number(process.env.FRANKS_SIDES_API_PORT ?? 6077);

app.listen(port, () => {
  console.log(`Shire Sides API listening on http://localhost:${port}`);
});
