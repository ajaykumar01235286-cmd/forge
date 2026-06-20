import { getRunbooksHandler } from "./runbook.controller.js";

export async function runbookRoutes(fastify) {
    fastify.get("/runbooks", { preHandler: [fastify.authenticate] }, getRunbooksHandler);
}