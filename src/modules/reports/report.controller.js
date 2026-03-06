import {eq } from "drizzle-orm";
import {reports} from "../../db/schema.js";

export async function getReportHandler(req, reply){
   try {
    const {incidentId} = req.params;
    console.log("DEBUG - The Incident ID is:", incidentId);
    const result = await req.server.db.select().from(reports).where(eq(reports.incidentId, incidentId));
    if (!result.length) {
            return reply.status(404).send({ error: "Report not found for this incident" });
        }
    return {
        success: true,
        reports: result
    };
   } catch (error) {
    req.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch report" });
   } 
}