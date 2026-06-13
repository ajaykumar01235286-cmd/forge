import { getGraphHandler } from "./graph.controller.js";

export async function graphRoutes(fastify) {
    fastify.get("/graph", { preHandler: [fastify.authenticate] }, getGraphHandler);
}