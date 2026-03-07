import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { analyzeEvidence } from "../modules/analysis/analysis.service.js";
import { saveReport } from "../modules/reports/reports.repository.js";
import { db } from "../db/Client.js"; 

const connection = new IORedis({
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "analysis-queue",
  async (job) => {
    const { incidentId } = job.data;
    console.log(`[Worker] Starting analysis for incident: ${incidentId}`);

 
    const aiAnalysis = await analyzeEvidence(db, incidentId);

    if (!aiAnalysis) {
    
      throw new Error(`No evidence found for incident ${incidentId}`); 
    }

   
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
  console.log(`[Worker]  Analysis saved successfully for incident ${job.data.incidentId}`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker]  Analysis job ${job.id} failed:`, err.message);
});

console.log(" Forge Analysis Worker is running and waiting for jobs...");