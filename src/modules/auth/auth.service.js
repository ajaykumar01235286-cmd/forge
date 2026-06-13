import bcrypt from "bcrypt";
import { users, organizations } from "../../db/schema.js";
import { eq } from "drizzle-orm";

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