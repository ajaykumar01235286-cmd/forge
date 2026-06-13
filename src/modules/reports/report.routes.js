import { getReportHandler } from "./report.controller.js";
import { rescoreHandler } from "./score.controller.js";

export default async function reportRoutes(fastify) {
    fastify.get("/:incidentId", { preHandler: [fastify.authenticate] }, getReportHandler);
    fastify.post("/:reportId/score", { preHandler: [fastify.authenticate] }, rescoreHandler);
}