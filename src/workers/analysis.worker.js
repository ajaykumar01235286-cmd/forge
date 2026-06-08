import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { analyzeEvidence } from "../modules/analysis/analysis.service.js";
import { updateReportStatus, saveScoredRunbook, saveEscalationTier } from "../modules/reports/reports.repository.js";
import { db } from "../db/Client.js";
import { writeToGraph } from "../modules/analysis/graphWriter.js";
import { scoreRunbook } from "../modules/analysis/runbookScorer.js";
import { decideEscalation } from "../modules/analysis/escalationRouter.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
    "analysis-queue",
    async (job) => {
        const { incidentId, reportId } = job.data;

        console.log(`[Worker] Job started — incident: ${incidentId}, report: ${reportId}`);

        // 1. Mark as processing so the frontend knows work has begun
        await updateReportStatus(db, reportId, "processing");

        // 2. Run the AI analysis
        const aiAnalysis = await analyzeEvidence(db, incidentId);

        if (!aiAnalysis) {
            throw new Error(`No evidence found for incident ${incidentId}`);
        }

        // 3. Write the result and mark completed
       // 3. Write the result and mark completed
await updateReportStatus(db, reportId, "completed", aiAnalysis);
await writeToGraph(db, incidentId, aiAnalysis);

// 4. Auto-score the runbook (fire-and-forget — never fail the job over this)
try {
    const scored = await scoreRunbook(aiAnalysis);
    if (scored) {
        await saveScoredRunbook(db, reportId, scored);
        console.log(`[Scorer] Ranked ${scored.scoredSteps.length} step(s) — first action: ${scored.recommendedFirstAction}`);
    }
} catch (err) {
    console.error("[Scorer] Scoring failed silently:", err.message);
}
// 5. Decide escalation tier from confidence score
try {
    const escalation = decideEscalation(aiAnalysis);
    await saveEscalationTier(db, reportId, escalation.tier);
    console.log(`[Escalation] ${escalation.tier.toUpperCase()} (score ${escalation.score})`);

    // Auto-resolve tier → push RCA to Slack
    if (escalation.tier === "auto-resolve") {
        await dispatchToSlack(incidentId, aiAnalysis, escalation);
    }
} catch (err) {
    console.error("[Escalation] Failed silently:", err.message);
}

















console.log(`[Worker] Completed — report: ${reportId}`);
    },
    {
        connection,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000
        }
    }
);

worker.on("failed", async (job, err) => {
    console.error(`[Worker] Job permanently failed — report: ${job.data.reportId}`, err.message);

    // Mark the report as failed so the user isn't left with "processing" forever
    try {
        await updateReportStatus(db, job.data.reportId, "failed");
    } catch (updateErr) {
        console.error(`[Worker] Could not update report to failed state:`, updateErr.message);
    }
});