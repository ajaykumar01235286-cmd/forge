
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const analysisQueue = new Queue("analysis-queue", { connection });

export async function analyzeIncidentHandler(req, reply) {
    try {
        const { incidentId } = req.params;


        const job = await analysisQueue.add("analyze-incident", {
            incidentId
        });


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