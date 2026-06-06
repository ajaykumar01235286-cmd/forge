import { eq, and } from "drizzle-orm";
import { causalGraphNodes, causalGraphEdges } from "../../db/schema.js";

export async function writeToGraph(db, incidentId, aiPayload) {
    try {
        const fingerprint = aiPayload?.incidentFingerprint;
        const rootCause = aiPayload?.rootCauseAnalysis;

        if (!fingerprint?.primaryFailingComponent) {
            console.log("[Graph] No primaryFailingComponent found — skipping graph write");
            return;
        }

        const primaryComponent = fingerprint.primaryFailingComponent.toLowerCase().trim();

        // Extract downstream components from evidence citations and diagnostic reasoning
        const downstreamComponents = extractDownstreamComponents(aiPayload, primaryComponent);

        if (downstreamComponents.length === 0) {
            console.log(`[Graph] No downstream components found for ${primaryComponent}`);
            return;
        }

        // Upsert the primary (source) node
        const sourceNode = await upsertNode(db, primaryComponent, "service");

        // For each downstream component — upsert node + upsert edge
        for (const downstream of downstreamComponents) {
            const targetNode = await upsertNode(db, downstream, "service");
            await upsertEdge(db, sourceNode.id, targetNode.id, "cascade");
        }

        console.log(`[Graph] Wrote ${downstreamComponents.length} edge(s) for incident ${incidentId}`);

    } catch (error) {
        // Graph write failure must NEVER crash the worker
        console.error("[Graph] Write failed silently:", error.message);
    }
}

function extractDownstreamComponents(aiPayload, primaryComponent) {
    const found = new Set();

    // Known infrastructure component keywords to look for
    const componentPatterns = [
        /auth[-_]service/gi,
        /api[-_]gateway/gi,
        /db[-_]pooler/gi,
        /postgres/gi,
        /redis/gi,
        /kafka/gi,
        /nginx/gi,
        /k8s[-_]monitor/gi,
        /payment[-_]service/gi,
        /user[-_]service/gi,
        /notification[-_]service/gi,
        /order[-_]service/gi,
        /inventory[-_]service/gi,
    ];

    // Search through diagnostic reasoning observations
    const reasoning = aiPayload?.diagnosticReasoning ?? [];
    for (const step of reasoning) {
        const text = `${step.observation ?? ""} ${step.deduction ?? ""}`;
        for (const pattern of componentPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(m => {
                    const normalized = m.toLowerCase().replace(/_/g, "-");
                    if (normalized !== primaryComponent) found.add(normalized);
                });
            }
        }
    }

    // Also search evidence citations
    const citations = aiPayload?.rootCauseAnalysis?.evidenceCitations ?? [];
    for (const citation of citations) {
        for (const pattern of componentPatterns) {
            const matches = citation.match(pattern);
            if (matches) {
                matches.forEach(m => {
                    const normalized = m.toLowerCase().replace(/_/g, "-");
                    if (normalized !== primaryComponent) found.add(normalized);
                });
            }
        }
    }

    return [...found];
}

async function upsertNode(db, componentName, componentType) {
    // Check if node already exists
    const existing = await db
        .select()
        .from(causalGraphNodes)
        .where(eq(causalGraphNodes.componentName, componentName));

    if (existing.length > 0) {
        // Node exists — increment incident count
        const updated = await db
            .update(causalGraphNodes)
            .set({ incidentCount: existing[0].incidentCount + 1 })
            .where(eq(causalGraphNodes.id, existing[0].id))
            .returning();
        return updated[0];
    }

    // Node doesn't exist — create it
    const created = await db
        .insert(causalGraphNodes)
        .values({ componentName, componentType })
        .returning();
    return created[0];
}

async function upsertEdge(db, fromNodeId, toNodeId, failureType) {
    // Check if edge already exists between these two nodes
    const existing = await db
        .select()
        .from(causalGraphEdges)
        .where(
            and(
                eq(causalGraphEdges.fromNodeId, fromNodeId),
                eq(causalGraphEdges.toNodeId, toNodeId)
            )
        );

    if (existing.length > 0) {
        // Edge exists — increment occurrence count and update lastSeenAt
        const updated = await db
            .update(causalGraphEdges)
            .set({
                occurrenceCount: existing[0].occurrenceCount + 1,
                lastSeenAt: new Date()
            })
            .where(eq(causalGraphEdges.id, existing[0].id))
            .returning();
        return updated[0];
    }

    // Edge doesn't exist — create it
    const created = await db
        .insert(causalGraphEdges)
        .values({ fromNodeId, toNodeId, failureType })
        .returning();
    return created[0];
}