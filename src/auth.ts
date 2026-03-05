import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import * as crypto from "node:crypto";
import { TokenError } from "./error.js";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    throw new Error("Failed to hash password");
  }
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    if (await argon2.verify(hash, password)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error("Failed to verify password");
  }
}

export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const payload: payload = {
    iss: "chirpy",
    sub: userID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret) as Required<payload>;
    return decoded.sub;
  } catch (err) {
    throw new TokenError("Failed to validate JWT");
  }
}

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    throw new Error("No Authorization header");
  }
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer") {
    throw new Error("Invalid Authorization header");
  }

  if (!token) {
    throw new Error("Invalid Authorization header");
  }
  return token;
}

export function makeRefreshToken(): string {
  try {
    const buf = crypto.randomBytes(256);
    return buf.toString("hex");
  } catch (err) {
    throw new Error("Failed to generate refresh token");
  }
}
