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
app.post("/api/users", createUserHandler);
app.get("/api/chirps", allChirpsHandler);
app.get("/api/chirps/:chirpId", getChirpHandler);
// Admin endpoints
app.get("/admin/metrics", hits);
app.post("/admin/reset", reset);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
