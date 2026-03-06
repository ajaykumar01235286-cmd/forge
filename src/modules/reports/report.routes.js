import { getReportHandler } from "./report.controller.js";
export default async function reportRoutes(fastify) {
    fastify.get(
        "/:incidentId",
        getReportHandler
    );
}