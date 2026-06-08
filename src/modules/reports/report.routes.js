import { getReportHandler } from "./report.controller.js";
import { rescoreHandler } from "./score.controller.js";

export default async function reportRoutes(fastify) {
    fastify.get("/:incidentId", getReportHandler);
    fastify.post("/:reportId/score", rescoreHandler);
}