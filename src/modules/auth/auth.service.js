import bcrypt from "bcrypt";
import { users, organizations, passwordResetTokens } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}

export async function findUserByEmail(db, email) {
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return rows[0] ?? null;
}

export async function createOrganization(db, name) {
    const rows = await db.insert(organizations).values({ name }).returning();
    return rows[0];
}

export async function createUser(db, email, passwordHash, organizationId) {
    const rows = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        organizationId,
        role: "owner",
    }).returning();
    return rows[0];
}

export function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

export async function createResetToken(db, userId, token, expiresAt) {
    const rows = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
    return rows[0];
}

export async function findValidResetToken(db, token) {
    const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    const t = rows[0];
    if (!t) return null;
    if (t.used) return null;
    if (new Date(t.expiresAt) < new Date()) return null;
    return t;
}

export async function markTokenUsed(db, tokenId) {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, tokenId));
}

export async function updateUserPassword(db, userId, passwordHash) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}