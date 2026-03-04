import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import { TooLongError, InvalidEmailError } from "./error.js";
import { createUser, resetUser } from "./db/queries/users.js";
import { createChirp, allChirps, getChirp } from "./db/queries/chirps.js";
import type { NewUser } from "./db/schema.js";

type ChirpQuery = {
  chirpId: string;
};

export async function createChirpHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    body: string;
    userId: string;
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
    const Chirp = await createChirp({
      body: joinedBody,
      userId: params.userId,
    });

    return res.status(201).send(
      JSON.stringify({
        id: Chirp.id,
        createdAt: Chirp.createdAt,
        updatedAt: Chirp.updatedAt,
        body: Chirp.body,
        userId: Chirp.userId,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function allChirpsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const Chirps = await allChirps();

    res.contentType("text/plain");
    return res.status(200).json(Chirps);
  } catch (err) {
    next(err);
  }
}

export async function getChirpHandler(
  req: Request<ChirpQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { chirpId } = req.params;

    const chirp = await getChirp(chirpId);

    if (!chirp) {
      return res.status(404).json({ error: "Chirp not found" });
    }

    return res.status(200).json(chirp);
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    email: string;
  };
  try {
    const params: parameters = req.body;

    if (params.email.length < 2) {
      throw new InvalidEmailError("Email is too short");
    }
    const newUser: NewUser = {
      email: params.email,
    };
    const user = await createUser(newUser);

    return res.status(201).send(
      JSON.stringify({
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
      }),
    );
  } catch (err) {
    next(err);
  }
}

//
//Admin Handlers and Utilities
//

export function healthHandler(req: Request, res: Response) {
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

export async function reset(req: Request, res: Response) {
  if (process.env.PLATFORM !== "dev") {
    return res.status(403).send("Forbidden");
  }
  const delUsers = await resetUser();
  config.fileserverHits = 0;
  res.contentType("text/plain");
  return res.send(`Hits: ${config.fileserverHits}`);
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
