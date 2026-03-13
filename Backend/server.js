import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { query } from "./src/config/db.js";
import { initializeSchema } from "./src/db/initSchema.js";

const start = async () => {
  await query("SELECT 1");
  await initializeSchema();

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
