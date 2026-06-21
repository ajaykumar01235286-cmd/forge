import {
    signupHandler, loginHandler, meHandler, logoutHandler,
    forgotPasswordHandler, resetPasswordHandler
} from "./auth.controller.js";

export default async function authRoutes(fastify) {
    // tighter rate limit on the brute-force targets
    const authLimit = { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } };

    fastify.post("/signup", authLimit, signupHandler);
    fastify.post("/login", authLimit, loginHandler);
    fastify.post("/logout", logoutHandler);
    fastify.post("/forgot-password", authLimit, forgotPasswordHandler);
    fastify.post("/reset-password", authLimit, resetPasswordHandler);
    fastify.get("/me", { preHandler: [fastify.authenticate] }, meHandler);
}