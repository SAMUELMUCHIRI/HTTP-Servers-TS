import express from "express";

import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import {
  handlerReadiness,
  hits,
  reset,
  validateChirp,
  errorHandler,
} from "./handlers.js";

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(middlewareLogResponses);

//
// Routes
//
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
// API endpoints
app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", validateChirp);
// Admin endpoints
app.get("/admin/metrics", hits);
app.post("/admin/reset", reset);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
