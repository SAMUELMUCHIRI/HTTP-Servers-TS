process.loadEnvFile(".env");
import type { MigrationConfig } from "drizzle-orm/migrator";
type SecretConfig = {
  secretSign: string;
};
type DBConfig = {
  db: { url: string; migrationConfig: MigrationConfig };
};

type APIConfig = {
  fileserverHits: number;
};

export const config: DBConfig & APIConfig & SecretConfig = {
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },
  fileserverHits: 0,
  secretSign: envOrThrow("SECRET_SIGN"),
};

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

function envOrThrow(key: string): string {
  const value = process.env[key];

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}
