import { incidents, evidence } from "../../db/schema.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const analysisQueue = new Queue("analysis-queue", { connection });
export async function datadogWebhookHandler(req, reply) {
    try {

    } catch (error) {

    }
}