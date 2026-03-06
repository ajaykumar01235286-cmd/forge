// src/modules/analysis/analysis.controller.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

// Connect to Redis and instantiate the queue
const connection = new IORedis({ maxRetriesPerRequest: null });
const analysisQueue = new Queue("analysis-queue", { connection });

export async function analyzeIncidentHandler(req, reply) {     
    try {         
        const { incidentId } = req.params;          
        
        // 1. Drop the job into the Redis Queue
        const job = await analysisQueue.add("analyze-incident", { 
            incidentId 
        });
        
        // 2. Return instantly. The Worker handles the AI and Database now!
        return reply.status(202).send({ 
            success: true, 
            message: "Analysis job queued successfully. The AI is processing it in the background.",
            jobId: job.id
        });

    } catch (error) {         
        req.log.error(error);         
        return reply.status(500).send({ error: "Failed to queue analysis job" });     
    } 
}