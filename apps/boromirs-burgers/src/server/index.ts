import { app } from "./app";

const port = Number(process.env.BOROMIRS_API_PORT ?? 6075);

app.listen(port, () => {
  console.log(`Boromirs Burgers API listening on http://localhost:${port}`);
});
