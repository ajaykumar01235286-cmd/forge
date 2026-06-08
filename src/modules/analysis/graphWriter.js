import { eq, and } from "drizzle-orm";
import { causalGraphNodes, causalGraphEdges } from "../../db/schema.js";
import { findComponentsInText } from "./componentRegistry.js";

export async function writeToGraph(db, incidentId, aiPayload, tenantId = "default") {
    try {
        const fingerprint = aiPayload?.incidentFingerprint;

        if (!fingerprint?.primaryFailingComponent) {
            console.log("[Graph] No primaryFailingComponent — skipping graph write");
            return;
        }

        const primaryComponent = fingerprint.primaryFailingComponent.toLowerCase().trim();
        const downstreamComponents = extractDownstreamComponents(aiPayload, primaryComponent);

        if (downstreamComponents.length === 0) {
            console.log(`[Graph] No downstream components for ${primaryComponent}`);
            return;
        }

        const sourceNode = await upsertNode(db, primaryComponent, "service", tenantId);

        for (const downstream of downstreamComponents) {
            const targetNode = await upsertNode(db, downstream, "service", tenantId);
            await upsertEdge(db, sourceNode.id, targetNode.id, "cascade", tenantId);
        }

        console.log(`[Graph] Wrote ${downstreamComponents.length} edge(s) for incident ${incidentId} (tenant: ${tenantId})`);

    } catch (error) {
        console.error("[Graph] Write failed silently:", error.message);
    }
}

function extractDownstreamComponents(aiPayload, primaryComponent) {
    const found = new Set();

    const reasoning = aiPayload?.diagnosticReasoning ?? [];
    for (const step of reasoning) {
        const text = `${step.observation ?? ""} ${step.deduction ?? ""}`;
        findComponentsInText(text).forEach(c => {
            if (c !== primaryComponent) found.add(c);
        });
    }

    const citations = aiPayload?.rootCauseAnalysis?.evidenceCitations ?? [];
    for (const citation of citations) {
        findComponentsInText(citation).forEach(c => {
            if (c !== primaryComponent) found.add(c);
        });
    }

    return [...found];
}

async function upsertNode(db, componentName, componentType, tenantId) {
    const existing = await db
        .select()
        .from(causalGraphNodes)
        .where(
            and(
                eq(causalGraphNodes.componentName, componentName),
                eq(causalGraphNodes.tenantId, tenantId)
            )
        );

    if (existing.length > 0) {
        const updated = await db
            .update(causalGraphNodes)
            .set({ incidentCount: existing[0].incidentCount + 1 })
            .where(eq(causalGraphNodes.id, existing[0].id))
            .returning();
        return updated[0];
    }

    const created = await db
        .insert(causalGraphNodes)
        .values({ componentName, componentType, tenantId })
        .returning();
    return created[0];
}

async function upsertEdge(db, fromNodeId, toNodeId, failureType, tenantId) {
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

    const created = await db
        .insert(causalGraphEdges)
        .values({ fromNodeId, toNodeId, failureType, tenantId })
        .returning();
    return created[0];
}