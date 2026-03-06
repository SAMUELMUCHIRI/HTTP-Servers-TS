import express from "express";
import postgres from "postgres";
import { config } from "./config.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import {
  healthHandler,
  hits,
  reset,
  createChirpHandler,
  errorHandler,
  createUserHandler,
  allChirpsHandler,
  getChirpHandler,
  loginUserHandler,
  refreshTokenHandler,
  revokeTokenHandler,
  upgradeUserHandler,
} from "./handlers.js";

const app = express();
const PORT = 8080;
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
//
// Middleware
//
app.use(express.json());
app.use(middlewareLogResponses);

//
// Routes
//
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
// API endpoints
app.get("/api/healthz", healthHandler);
app.post("/api/chirps", createChirpHandler);

app.get("/api/chirps", allChirpsHandler);
app.get("/api/chirps/:chirpId", getChirpHandler);
//authentication
app.post("/api/login", loginUserHandler);
app.post("/api/users", createUserHandler);
app.post("/api/refresh", refreshTokenHandler);
app.post("/api/revoke", revokeTokenHandler);
app.post("/api/polka/webhooks", upgradeUserHandler);

// Admin endpoints
app.get("/admin/metrics", hits);
app.post("/admin/reset", reset);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
