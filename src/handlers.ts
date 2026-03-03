import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import { TooLongError } from "./error.js";

export async function reset(req: Request, res: Response) {
  config.fileserverHits = 0;
  res.contentType("text/plain");
  res.send(`Hits: ${config.fileserverHits}`);
}

export async function validateChirp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    body: string;
  };

  try {
    const params: parameters = req.body;

    if (params.body.length > 140) {
      throw new TooLongError("Chirp is too long");
    }

    const trimBody = params.body.trim();
    const splitBody = trimBody.split(" ");
    const cleanBody = splitBody.map((word) => {
      if (
        word.toLowerCase() === "kerfuffle" ||
        word.toLowerCase() === "sharbert" ||
        word.toLowerCase() === "fornax"
      ) {
        return "****";
      }
      return word;
    });

    const joinedBody = cleanBody.join(" ");

    return res.status(200).send(
      JSON.stringify({
        cleanedBody: joinedBody,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export function handlerReadiness(req: Request, res: Response) {
  res.contentType("text/plain");
  res.send("OK");
}

export function hits(req: Request, res: Response) {
  res.contentType("text/html");
  res.send(`
    <html>
    <body>
      <h1>Welcome, Chirpy Admin</h1>
      <p>Chirpy has been visited ${config.fileserverHits} times!</p>
    </body>
  </html>`);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof TooLongError) {
    res.status(400).json({
      error: "Chirp is too long. Max length is 140",
    });
  } else {
    res.status(500).json({
      error: "Something went wrong on our end",
    });
  }
}
