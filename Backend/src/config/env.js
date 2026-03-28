import dotenv from "dotenv";

dotenv.config({ override: true });

const normalizeDatabaseUrl = (rawValue) => {
  const value = rawValue?.trim();
  if (!value) return null;

  if (value.startsWith("jdbc:postgresql://")) {
    return value.replace("jdbc:", "");
  }

  return value;
};

const buildDatabaseUrlFromParts = () => {
  const host = process.env.PGHOST || "localhost";
  const port = process.env.PGPORT || "5432";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || process.env.PASSWORD || "postgres";
  const database = process.env.PGDATABASE || "procurement";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl:
    normalizeDatabaseUrl(process.env.DATABASE_URL) ||
    buildDatabaseUrlFromParts(),
  jwtSecret:
    process.env.JWT_SECRET ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
};
