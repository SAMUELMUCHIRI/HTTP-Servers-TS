import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import {
  TooLongError,
  InvalidEmailError,
  LoginError,
  UserNotFoundError,
} from "./error.js";
import {
  createUser,
  getUser,
  resetUser,
  upgradeUser,
  getUserByID,
  updateUser,
} from "./db/queries/users.js";
import {
  createChirp,
  allChirps,
  getChirp,
  deleteChirp,
} from "./db/queries/chirps.js";
import {
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
} from "./db/queries/tokens.js";
import type { NewUser, NewRefreshToken } from "./db/schema.js";
import {
  hashPassword,
  checkPasswordHash,
  makeJWT,
  validateJWT,
  getBearerToken,
  makeRefreshToken,
  getAPIKey,
} from "./auth.js";
import { TokenError } from "./error.js";
type ChirpQuery = {
  chirpId: string;
};

type createNewuser = Omit<NewUser, "hashedPassword">;

type loginUser = Omit<NewUser, "hashedPassword"> & {
  token: string;
  refreshToken: string;
};

export async function createChirpHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    body: string;
  };

  try {
    const token = getBearerToken(req);

    const user = validateJWT(token, config.secretSign);

    if (!user) {
      return res.status(401).send();
    }

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
      userId: user,
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

export async function deleteChirpHandler(
  req: Request<ChirpQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    //get chirp params
    const { chirpId } = req.params;

    //get chirp from db
    const chirp = await getChirp(chirpId);
    if (!chirp) {
      return res.status(404).json({ error: "Chirp not found" });
    }

    //get token and validate
    const token = getBearerToken(req);
    const user = validateJWT(token, config.secretSign);
    if (!user) {
      return res.status(401).send();
    }

    //check if user is the author of the chirp
    if (chirp.userId !== user) {
      return res.status(403).send();
    }

    const deleteResult = await deleteChirp(chirpId);
    return res.status(204).send();
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
    password: string;
  };

  try {
    const params: Required<parameters> = req.body;

    if (params.email.length < 2) {
      throw new InvalidEmailError("Email is too short");
    }
    const newUser: NewUser = {
      email: params.email,
      hashedPassword: await hashPassword(params.password),
    };
    const user = await createUser(newUser);
    const response: createNewuser = {
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      isChirpyRed: user.isChirpyRed,
    };

    return res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function loginUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    email: string;
    password: string;
  };

  type parametersTime = Required<parameters>;
  try {
    const params: Required<parametersTime> = req.body;

    const userdetail = await getUser(params.email);

    if (!userdetail) {
      throw new LoginError("incorrect email or password");
    }
    const check = await checkPasswordHash(
      params.password,
      userdetail.hashedPassword,
    );

    if (!check) {
      throw new LoginError("incorrect email or password");
    }
    let jwtToken: string;

    jwtToken = makeJWT(userdetail.id, 3600, config.secretSign);
    const refresh_Token = makeRefreshToken();
    const days = 60;

    const newRefreshToken: NewRefreshToken = {
      userId: userdetail.id,
      token: refresh_Token,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    };
    const resultToken = await createRefreshToken(newRefreshToken);

    const response: loginUser = {
      id: userdetail.id,
      createdAt: userdetail.createdAt,
      updatedAt: userdetail.updatedAt,
      email: userdetail.email,
      token: jwtToken,
      refreshToken: refresh_Token,
      isChirpyRed: userdetail.isChirpyRed,
    };
    return res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function refreshTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new Error("No Authorization header");
    }

    const refreshToken = await getRefreshToken(token);

    if (
      !refreshToken ||
      refreshToken.expiresAt < new Date() ||
      refreshToken.revokedAt
    ) {
      return res.status(401).send();
    }

    const jwtToken = makeJWT(refreshToken.userId, 3600, config.secretSign);

    return res.status(200).send(
      JSON.stringify({
        token: jwtToken,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function revokeTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(req);

    const refreshToken = await revokeRefreshToken(token);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function upgradeUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    event: string;
    data: {
      userId: string;
    };
  };

  try {
    const token = getAPIKey(req);
    if (token !== config.PolkaKey) {
      return res.status(401).send();
    }
    const { event, data } = req.body as Required<parameters>;
    if (event !== "user.upgraded") {
      return res.status(204).send();
    }
    const { userId } = data;
    const user = await getUserByID(userId);
    if (!user) {
      return res.status(404).send();
    }
    const upgradedUser = await upgradeUser(userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  type parameters = {
    email: string;
    password: string;
  };

  type parametersTime = Required<parameters>;
  try {
    //get token and validate
    const token = getBearerToken(req);
    const user = validateJWT(token, config.secretSign);

    if (!user) {
      return res.status(401).send();
    }

    //get body parameters
    const params: Required<parametersTime> = req.body;

    //Create password hash
    const newUser: NewUser = {
      email: params.email,
      hashedPassword: await hashPassword(params.password),
    };

    //Update user
    const updatedUser = await updateUser(user, newUser);
    if (!updatedUser) {
      return res.status(401).send();
    }

    //Return updated user
    return res.status(200).json(updatedUser);
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
  } else if (err instanceof LoginError) {
    res.status(401).json({
      error: "incorrect email or password",
    });
  } else if (err instanceof TokenError) {
    res.status(401).send();
  } else {
    res.status(500).json({
      error: "Something went wrong on our end",
    });
  }
}
