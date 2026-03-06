import { reports } from "../../db/schema.js";
export async function saveReport(db ,data){
    const result = await db.insert(reports).values({incidentId: data.incidentId,summary: data.summary,hypotheses: data.hypotheses, modelUsed: data.modelUsed}).returning(); return result[0];
}