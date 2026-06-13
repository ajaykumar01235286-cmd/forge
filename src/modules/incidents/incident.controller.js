import { incidents, reports } from "../../db/schema.js";
import fs from "fs/promises";
import path from "path";
import { extractEvidence } from "../evidence/evidence.service.js";
import { saveEvidence } from "../evidence/evidence.repository.js";
import { createIncident, saveIncidentFile } from "./incident.service.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { desc } from "drizzle-orm";


export async function createIncidentHandler(req, reply) {
    const { title, description } = req.body;
    const userId = "00000000-0000-0000-0000-000000000001";
    const incident = await createIncident(req.server.db, { title, description, userId });
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
        const allIncidents = await req.server.db
            .select()
            .from(incidents)
            .orderBy(desc(incidents.createdAt));

        // fetch all reports once, then match in JS (simple + fine at this scale)
        const allReports = await req.server.db.select().from(reports);

        // map: incidentId -> most recent report
        const reportByIncident = {};
        for (const r of allReports) {
            const existing = reportByIncident[r.incidentId];
            if (!existing || new Date(r.createdAt) > new Date(existing.createdAt)) {
                reportByIncident[r.incidentId] = r;
            }
        }

        // enrich each incident with its report's real severity / confidence / status
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