import fs from "fs/promises";
import path from "path";
import { extractEvidence } from "../evidence/evidence.service.js";
import { saveEvidence } from "../evidence/evidence.repository.js";
import { createIncident, saveIncidentFile } from "./incident.service.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
import { desc } from "drizzle-orm";
import { incidents } from "../../db/schema.js";

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
        const all = await req.server.db
            .select()
            .from(incidents)
            .orderBy(desc(incidents.createdAt));
        return { success: true, incidents: all };
    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to list incidents" });
    }
}