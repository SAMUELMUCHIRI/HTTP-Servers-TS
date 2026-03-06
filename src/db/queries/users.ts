import { db } from "../index.js";
import { NewUser, users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUser(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}

export async function getUserByID(id: string) {
  const [result] = await db.select().from(users).where(eq(users.id, id));
  return result;
}

export async function upgradeUser(id: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, id))
    .returning();
  return result;
}

export async function updateUser(id: string, user: NewUser) {
  const [result] = await db
    .update(users)
    .set({ email: user.email, hashedPassword: user.hashedPassword })
    .where(eq(users.id, id))
    .returning();
  return result;
}

export async function resetUser() {
  const result = await db.delete(users).returning();
  return result;
}
