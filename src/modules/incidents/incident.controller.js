import { incidents, reports } from "../../db/schema.js";
import fs from "fs/promises";
import path from "path";
import { extractEvidence } from "../evidence/evidence.service.js";
import { saveEvidence } from "../evidence/evidence.repository.js";
import { createIncident, saveIncidentFile } from "./incident.service.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { desc, eq, and } from "drizzle-orm";


export async function createIncidentHandler(req, reply) {
    const { title, description } = req.body;
    const userId = req.user.id;                       // real logged-in user
    const tenantId = req.user.organizationId;         // their org
    const incident = await createIncident(req.server.db, { title, description, userId, tenantId });
    return { success: true, data: incident };
}

export async function uploadIncidentFileHandler(req, reply) {
    const { incidentId } = req.params;
    const data = await req.file();
    const fileName = `${Date.now()}-${data.filename}`;
    const filePath = path.join("uploads", fileName);
    await fs.writeFile(filePath, await data.toBuffer());
    const record = await saveIncidentFile(req.server.db, { incidentId, fileType: data.mimetype, filePath });
    const evidenceData = await extractEvidence(filePath);
    await saveEvidence(req.server.db, incidentId, evidenceData);
    await analysisQueue.add("analyze-incident", { incidentId });
    return { success: true, file: record, evidence: evidenceData };
}

export async function listIncidentsHandler(req, reply) {
    try {
        const tenantId = req.user.organizationId;     // scope to caller's org

        const allIncidents = await req.server.db
            .select()
            .from(incidents)
            .where(eq(incidents.tenantId, tenantId))
            .orderBy(desc(incidents.createdAt));

        // fetch reports for THIS org's incidents only
        const incidentIds = new Set(allIncidents.map(i => i.id));
        const allReports = await req.server.db.select().from(reports);

        const reportByIncident = {};
        for (const r of allReports) {
            if (!incidentIds.has(r.incidentId)) continue;   // ignore other orgs' reports
            const existing = reportByIncident[r.incidentId];
            if (!existing || new Date(r.createdAt) > new Date(existing.createdAt)) {
                reportByIncident[r.incidentId] = r;
            }
        }

        const enriched = allIncidents.map((inc) => {
            const report = reportByIncident[inc.id];
            const ai = report?.aiPayload;
            return {
                ...inc,
                reportStatus: report?.status ?? "no-report",
                severity: ai?.incidentFingerprint?.severityLevel ?? null,
                primaryComponent: ai?.incidentFingerprint?.primaryFailingComponent ?? null,
                confidence: ai?.confidenceMatrix?.overallScore ?? null,
                escalationTier: report?.escalationTier ?? null,
            };
        });

        return { success: true, incidents: enriched };
    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to list incidents" });
    }
}