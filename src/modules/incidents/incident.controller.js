import fs from "fs/promises";
import path from "path";
import { extractEvidence } from "../evidence/evidence.service.js";
import { saveEvidence } from "../evidence/evidence.repository.js";
import { createIncident, saveIncidentFile } from "./incident.service.js";
import { analysisQueue } from "../../queues/analysis.queue.js";
export async function createIncidentHandler(req,reply){const {title,description}=req.body;  const userId = "00000000-0000-0000-0000-000000000001";const incident = await createIncident(req.server.db,{title,description,userId});return{success:true,data:incident};}
export async function uploadIncidentFileHandler(req, reply){const {incidentId} = req.params; const data = await req.file() ; const fileName = `${Date.now()}-${data.filename}`; const filePath = path.join("uploads", fileName); await fs.writeFile(filePath, await data.toBuffer()); const record = await saveIncidentFile(req.server.db,{incidentId,fileType: data.mimetype, filePath}); 
const evidenceData = await extractEvidence(filePath); await saveEvidence(req.server.db, incidentId,evidenceData);return{sucess: true, file: record,evidence: evidenceData};  
await analysisQueue.add("analyze-incident", {
  incidentId
});
}