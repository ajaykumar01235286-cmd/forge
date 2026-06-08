import { eq } from "drizzle-orm";
import { reports } from "../../db/schema.js";
import { scoreRunbook } from "../analysis/runbookScorer.js";
import { saveScoredRunbook } from "./reports.repository.js";

export async function rescoreHandler(req, reply) {
    try {
        const { reportId } = req.params;

        const rows = await req.server.db
            .select()
            .from(reports)
            .where(eq(reports.id, reportId));

        if (!rows.length) {
            return reply.status(404).send({ error: "Report not found" });
        }

        const report = rows[0];
        if (!report.aiPayload) {
            return reply.status(400).send({ error: "Report has no RCA payload to score yet" });
        }

        const scored = await scoreRunbook(report.aiPayload);
        if (!scored) {
            return reply.status(400).send({ error: "No mitigation steps available to score" });
        }

        await saveScoredRunbook(req.server.db, reportId, scored);

        return {
            success: true,
            reportId,
            scoredRunbook: scored
        };

    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Re-scoring failed" });
    }
}