import * as argon2 from "argon2";

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
    if (await argon2.verify(hash, "password")) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error("Failed to verify password");
  }
}
