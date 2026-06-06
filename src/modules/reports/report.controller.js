import { eq, desc } from "drizzle-orm";
import { reports } from "../../db/schema.js";

export async function getReportHandler(req, reply) {
    try {
        const { incidentId } = req.params;

        const result = await req.server.db
            .select()
            .from(reports)
            .where(eq(reports.incidentId, incidentId))
            .orderBy(desc(reports.createdAt))
            .limit(1);

        if (!result.length) {
            return reply.status(404).send({ error: "Report not found for this incident" });
        }

        return {
            success: true,
            report: result[0]
        };

    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch report" });
    }
}