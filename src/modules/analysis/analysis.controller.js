import { analyzeEvidence } from "./analysis.service.js"; 
import { saveReport } from "../reports/reports.repository.js"; 

export async function analyzeIncidentHandler(req, reply) {     
    try {         
        const { incidentId } = req.params;          

        // 1. Rename the variable to 'aiAnalysis' for clarity
        const aiAnalysis = await analyzeEvidence(req.server.db, incidentId);          

        if (!aiAnalysis) {             
            return reply.status(404).send({ error: "No evidence found for this incident" });         
        }     

        // 2. Save to the database using the parsed JSON fields from Gemini
        const report = await saveReport(req.server.db, {
            incidentId,
            summary: aiAnalysis.rootCause,       // Extract the specific root cause string
            hypotheses: aiAnalysis.hypotheses,   // Extract the array of hypotheses
            modelUsed: "gemini-2.5-flash"
        });      

        // 3. Return the final saved report to the client
        return {              
            success: true,              
            data: report          
        };     
    } catch (error) {         
        req.log.error(error);         
        return reply.status(500).send({ error: "Failed to analyze incident" });     
    } 
}