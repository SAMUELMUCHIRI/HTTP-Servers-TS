import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
const app = express();
const PORT = 8080;

//Logging Responses
app.use(middlewareLogResponses);

// Serving Static Files
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

// API endpoints
// App Health
app.get("/api/healthz", handlerReadiness);
// Validate Chirp
app.post("/api/validate_chirp", validateChirp);
// Admin Metrics & reset
app.get("/admin/metrics", hits);
app.post("/admin/reset", reset);

// App listening
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Handlers
function handlerReadiness(req: Request, res: Response) {
  res.contentType("text/plain");
  res.send("OK");
}

function hits(req: Request, res: Response) {
  res.contentType("text/html");
  res.send(`
    <html>
    <body>
      <h1>Welcome, Chirpy Admin</h1>
      <p>Chirpy has been visited ${config.fileserverHits} times!</p>
    </body>
  </html>`);
}

function reset(req: Request, res: Response) {
  config.fileserverHits = 0;
  res.contentType("text/plain");
  res.send(`Hits: ${config.fileserverHits}`);
}

function validateChirp(req: Request, res: Response) {
  let bodyEm = ""; // 1. Initialize

  // 2. Listen for data events
  req.on("data", (chunk) => {
    bodyEm += chunk;
  });

  // 3. Listen for end events
  req.on("end", () => {
    try {
      const parsedBody = JSON.parse(bodyEm);
      if (typeof parsedBody.body !== "string") {
        return res
          .status(400)
          .send(JSON.stringify({ error: "Body must be a string" }));
      }
      if (parsedBody.body.length > 140) {
        return res.status(400).send(
          JSON.stringify({
            error: "Chirp is too long",
          }),
        );
      }

      return res.status(200).send(
        JSON.stringify({
          valid: true,
        }),
      );
    } catch (error) {
      return res.status(400).send(
        JSON.stringify({
          error: "Something went wrong",
        }),
      );
    }
  });
}

//middleware
function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    if (res.statusCode !== 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`,
      );
    }
  });

  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileserverHits++;
  next();
}
