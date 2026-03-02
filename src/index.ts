import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", express.static("./src/app"));
app.get("/app", middlewareMetricsInc);
app.get("/healthz", handlerReadiness);

// App listening

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Handlers
function handlerReadiness(req: Request, res: Response) {
  res.contentType("text/plain");
  res.send("OK");
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
