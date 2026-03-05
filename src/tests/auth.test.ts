import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  makeJWT,
  validateJWT,
  hashPassword,
  checkPasswordHash,
  getBearerToken,
} from "../auth.js";
import type { Request } from "express";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});

describe("Create JWT", () => {
  const userID = "user123";
  const expiresIn = 3600;
  const secret = "mysecret";

  vi.useFakeTimers();

  it("should create a valid JWT", () => {
    const token = makeJWT(userID, expiresIn, secret);
    expect(token).toBeTypeOf("string");
  });

  it("JWT should have a valid signature", () => {
    const token = makeJWT(userID, expiresIn, secret);
    expect(validateJWT(token, secret)).toBe(userID);
  });

  it("JWT should be invalid when the secret is wrong", () => {
    const token = makeJWT(userID, expiresIn, secret);
    expect(() => validateJWT(token, "wrongsecret")).toThrowError();
  });

  it("JWT should be invalid when the time has expired", () => {
    const token = makeJWT(userID, 1, secret);
    vi.advanceTimersByTime(2000); // move time forward
    expect(() => validateJWT(token, secret)).toThrowError();
  });
});

describe("getBearerToken", () => {
  it("returns the token when Authorization header is valid", () => {
    const req = {
      url: "/api/test",
      headers: {
        authorization: "Bearer abc123",
      },
      get: (header: string) => {
        if (header === "Authorization") {
          return "Bearer abc123";
        }
        return undefined;
      },
    } as unknown as Request;

    const token = getBearerToken(req);

    expect(token).toBe("abc123");
  });

  it("throws if Authorization header is missing", () => {
    const req = {
      url: "/api/test",

      get: (header: string) => {
        if (header === "Authorization") {
          return undefined;
        }
        return undefined;
      },
    } as unknown as Request;

    expect(() => getBearerToken(req)).toThrow("No Authorization header");
  });

  it("throws if Authorization type is not Bearer", () => {
    const req = {
      url: "/api/test",
      headers: {
        authorization: "Basic abc123",
      },
      get: (header: string) => {
        if (header === "Authorization") {
          return "Basic abc123";
        }
        return undefined;
      },
    } as unknown as Request;

    expect(() => getBearerToken(req)).toThrow("Invalid Authorization header");
  });

  it("throws if Bearer token is missing", () => {
    const req = {
      url: "/api/test",
      headers: {
        authorization: "Bearer",
      },
    } as unknown as Request;

    expect(() => getBearerToken(req)).toThrow();
  });
});
