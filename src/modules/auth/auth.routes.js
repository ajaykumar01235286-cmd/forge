import {
    signupHandler, loginHandler, meHandler, logoutHandler,
    forgotPasswordHandler, resetPasswordHandler
} from "./auth.controller.js";

export default async function authRoutes(fastify) {
    fastify.post("/signup", signupHandler);
    fastify.post("/login", loginHandler);
    fastify.post("/logout", logoutHandler);
    fastify.post("/forgot-password", forgotPasswordHandler);
    fastify.post("/reset-password", resetPasswordHandler);
    fastify.get("/me", { preHandler: [fastify.authenticate] }, meHandler);
}