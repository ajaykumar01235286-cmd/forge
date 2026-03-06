import {evidence } from "../../db/schema.js"
export async function saveEvidence(db, incidentId, data){
    const result = await db.insert(evidence).values({incidentId,extractedData: data}).returning();return result[0];
}