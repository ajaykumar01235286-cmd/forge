import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { analyzeEvidence } from "../modules/analysis/analysis.service.js";
import { saveReport } from "../modules/reports/reports.repository.js";
import { db } from "../db/Client.js"; // *Ensure 'Client.js' matches the exact capitalization of your file!

// 1. THE REDIS FIX: BullMQ requires this setting to wait for jobs
const connection = new IORedis({
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "analysis-queue",
  async (job) => {
    const { incidentId } = job.data;
    console.log(`[Worker] Starting analysis for incident: ${incidentId}`);

    // 2. THE SERVICE CALL: Delegate to the service we already built
    const aiAnalysis = await analyzeEvidence(db, incidentId);

    if (!aiAnalysis) {
      // Throwing an error here automatically triggers the worker.on("failed") event
      throw new Error(`No evidence found for incident ${incidentId}`); 
    }

    // 3. THE DATABASE SAVE: Use the exact JSON fields from Gemini
    await saveReport(db, {
      incidentId,
      summary: aiAnalysis.rootCause,
      hypotheses: aiAnalysis.hypotheses,
      modelUsed: "gemini-2.5-flash"
    });

  },
  { connection }
);

worker.on("completed", job => {
  console.log(`[Worker] ✅ Analysis saved successfully for incident ${job.data.incidentId}`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] ❌ Analysis job ${job.id} failed:`, err.message);
});

console.log("🛠️  Forge Analysis Worker is running and waiting for jobs...");