import { hashPassword, verifyPassword, findUserByEmail, createUser, createOrganization } from "./auth.service.js";
const COOKIE_NAME = "forge_token";
const cookieOpts = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // https only in prod
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function signupHandler(req, reply) {
    const { email, password } = req.body ?? {};
    if (!email || !password) return reply.status(400).send({ error: "Email and password required" });
    if (password.length < 8) return reply.status(400).send({ error: "Password must be at least 8 characters" });

    const existing = await findUserByEmail(req.server.db, email);
    if (existing) return reply.status(409).send({ error: "An account with that email already exists" });

    // create the user's organization (they become its owner)
    const orgName = `${email.split("@")[0]}'s Workspace`;
    const org = await createOrganization(req.server.db, orgName);

    const passwordHash = await hashPassword(password);
    const user = await createUser(req.server.db, email, passwordHash, org.id);

    const token = req.server.jwt.sign({ id: user.id, email: user.email, organizationId: org.id });
    reply.setCookie(COOKIE_NAME, token, cookieOpts);
    return reply.status(201).send({ success: true, user: { id: user.id, email: user.email, organizationId: org.id } });
}

export async function loginHandler(req, reply) {
    const { email, password } = req.body ?? {};
    if (!email || !password) return reply.status(400).send({ error: "Email and password required" });

    const user = await findUserByEmail(req.server.db, email);
    if (!user) return reply.status(401).send({ error: "Invalid email or password" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return reply.status(401).send({ error: "Invalid email or password" });

    const token = req.server.jwt.sign({ id: user.id, email: user.email, organizationId: user.organizationId });
    reply.setCookie(COOKIE_NAME, token, cookieOpts);
    return reply.send({ success: true, user: { id: user.id, email: user.email, organizationId: user.organizationId } });
}
export async function meHandler(req, reply) {
    // protected — req.user is set by the auth hook
    return reply.send({ success: true, user: req.user });
}

export async function logoutHandler(req, reply) {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return reply.send({ success: true });
}