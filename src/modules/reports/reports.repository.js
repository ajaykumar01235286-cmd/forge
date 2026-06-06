import { eq } from "drizzle-orm";
import { reports } from "../../db/schema.js";

export async function saveReport(db, data) {
    const result = await db.insert(reports).values({
        incidentId: data.incidentId,
        aiPayload: data.analysis,
        modelUsed: data.modelUsed,
        status: "completed"
    }).returning();
    return result[0];
}

export async function createPendingReport(db, incidentId) {
    const result = await db.insert(reports).values({
        incidentId,
        status: "pending"
    }).returning();
    return result[0];
}

export async function updateReportStatus(db, reportId, status, aiPayload = null) {
    const updateData = { status };
    if (aiPayload) updateData.aiPayload = aiPayload;

    const result = await db.update(reports)
        .set(updateData)
        .where(eq(reports.id, reportId))
        .returning();
    return result[0];
}