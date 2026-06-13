import { signupHandler, loginHandler, meHandler, logoutHandler } from "./auth.controller.js";

export default async function authRoutes(fastify) {
    fastify.post("/signup", signupHandler);
    fastify.post("/login", loginHandler);
    fastify.post("/logout", logoutHandler);
    // protected: requires valid token
    fastify.get("/me", { preHandler: [fastify.authenticate] }, meHandler);
}