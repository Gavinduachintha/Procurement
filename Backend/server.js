import app from "./src/app.js";
import pg from "pg";
import { env } from "./src/config/env.js";
import { query } from "./src/config/db.js";
import { initializeSchema } from "./src/db/initSchema.js";

const ensureDatabaseExists = async () => {
  const parsed = new URL(env.databaseUrl);
  const targetDbName = parsed.pathname.replace(/^\//, "");

  const adminUrl = new URL(env.databaseUrl);
  adminUrl.pathname = "/postgres";

  const { Client } = pg;
  const adminClient = new Client({
    connectionString: adminUrl.toString(),
  });

  await adminClient.connect();
  try {
    const check = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName],
    );

    if (!check.rowCount) {
      await adminClient.query(
        `CREATE DATABASE "${targetDbName.replace(/"/g, "")}"`,
      );
      console.log(`Database '${targetDbName}' created.`);
    }
  } finally {
    await adminClient.end();
  }
};

const start = async () => {
  await ensureDatabaseExists();
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
