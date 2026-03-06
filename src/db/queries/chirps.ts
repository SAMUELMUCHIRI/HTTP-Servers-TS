import { db } from "../index.js";
import { chirps, NewChirp } from "../schema.js";
import { asc, eq, desc } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function allChirps() {
  const results = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
  return results;
}
export async function allChirpsDesc() {
  const results = await db
    .select()
    .from(chirps)
    .orderBy(desc(chirps.createdAt));
  return results;
}

export async function getChirp(id: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
  return result;
}

export async function getAuthorChirp(authorId: string) {
  const results = await db
    .select()
    .from(chirps)
    .where(eq(chirps.userId, authorId));
  return results;
}

export async function deleteChirp(id: string) {
  const result = await db.delete(chirps).where(eq(chirps.id, id));
  return result;
}
