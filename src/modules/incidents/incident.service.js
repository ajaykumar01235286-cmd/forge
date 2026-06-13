import {incidents, incidentFiles } from "../../db/schema.js";
export async function createIncident(db, data){
    const result = await db.insert(incidents).values({
        title: data.title,
        description: data.description,
        userId: data.userId,
        tenantId: data.tenantId
    }).returning();
    return result[0]
}
export async function saveIncidentFile(db,data){
   try {const result = await db.insert(incidentFiles)
    .values({
        incidentId:data.incidentId,
        fileType: data.fileType,
        filePath: data.filePath
    })
    .returning();
    return result[0];
} catch (error) {
    console.error("DATABASE ERROR:",error);
    throw error;
}}