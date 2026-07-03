import { app } from "./app";

const port = Number(process.env.FRODOS_API_PORT ?? 6074);

app.listen(port, () => {
  console.log(`Frodos Franks API listening on http://localhost:${port}`);
});
