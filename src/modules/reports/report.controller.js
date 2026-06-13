import { eq, desc } from "drizzle-orm";
import { reports, incidents } from "../../db/schema.js";

export async function getReportHandler(req, reply) {
    try {
        const { incidentId } = req.params;
        const tenantId = req.user.organizationId;

        // verify the incident belongs to the caller's org
        const incidentRows = await req.server.db
            .select()
            .from(incidents)
            .where(eq(incidents.id, incidentId))
            .limit(1);

        const incident = incidentRows[0];
        // same 404 whether it doesn't exist OR belongs to another org
        // (don't reveal that an incident exists in someone else's tenant)
        if (!incident || incident.tenantId !== tenantId) {
            return reply.status(404).send({ error: "Report not found for this incident" });
        }

        const result = await req.server.db
            .select()
            .from(reports)
            .where(eq(reports.incidentId, incidentId))
            .orderBy(desc(reports.createdAt))
            .limit(1);

        if (!result.length) {
            return reply.status(404).send({ error: "Report not found for this incident" });
        }

        return { success: true, report: result[0] };

    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch report" });
    }
}