import { app } from "./app";

const port = Number(process.env.BURGERS_SAUCES_API_PORT ?? 6078);

app.listen(port, () => {
  console.log(`Gondor Sauces API listening on http://localhost:${port}`);
});
