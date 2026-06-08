import { eq, and } from "drizzle-orm";
import { causalGraphNodes, causalGraphEdges } from "../../db/schema.js";
import { findComponentsInText } from "./componentRegistry.js";

export async function getGraphContext(db, primaryComponent, tenantId = "default") {
    try {
        if (!primaryComponent) return null;
        const normalized = primaryComponent.toLowerCase().trim();

        const nodes = await db
            .select()
            .from(causalGraphNodes)
            .where(
                and(
                    eq(causalGraphNodes.componentName, normalized),
                    eq(causalGraphNodes.tenantId, tenantId)
                )
            );

        if (nodes.length === 0) {
            console.log(`[GraphReader] MISS — no history for "${normalized}" (tenant: ${tenantId})`);
            return null;
        }

        const sourceNode = nodes[0];

        const edges = await db
            .select()
            .from(causalGraphEdges)
            .where(
                and(
                    eq(causalGraphEdges.fromNodeId, sourceNode.id),
                    eq(causalGraphEdges.tenantId, tenantId)
                )
            );

        if (edges.length === 0) return null;

        const enrichedEdges = await Promise.all(
            edges.map(async (edge) => {
                const targets = await db
                    .select()
                    .from(causalGraphNodes)
                    .where(eq(causalGraphNodes.id, edge.toNodeId));
                return {
                    downstream: targets[0]?.componentName ?? "unknown",
                    occurrenceCount: edge.occurrenceCount,
                    failureType: edge.failureType,
                    lastSeenAt: edge.lastSeenAt
                };
            })
        );

        enrichedEdges.sort((a, b) => b.occurrenceCount - a.occurrenceCount);

        console.log(`[GraphReader] HIT — "${normalized}" has ${enrichedEdges.length} known downstream failure(s) across ${sourceNode.incidentCount} incident(s)`);

        return {
            component: normalized,
            totalIncidents: sourceNode.incidentCount,
            knownBlastRadius: enrichedEdges
        };

    } catch (error) {
        console.error("[GraphReader] Query failed silently:", error.message);
        return null;
    }
}

export async function getBestGraphContext(db, fusedText, tenantId = "default") {
    const candidates = [...findComponentsInText(fusedText)];

    if (candidates.length === 0) {
        console.log("[GraphReader] No known components detected in logs");
        return null;
    }

    let best = null;

    for (const candidate of candidates) {
        const context = await getGraphContext(db, candidate, tenantId);
        if (context && (!best || context.knownBlastRadius.length > best.knownBlastRadius.length)) {
            best = context;
        }
    }

    if (!best) {
        console.log(`[GraphReader] No historical cause found among: ${candidates.join(", ")}`);
    }

    return best;
}

export function formatGraphContextForPrompt(graphContext) {
    if (!graphContext) return "";

    const lines = [
        `FORGE HISTORICAL MEMORY (${graphContext.component}):`,
        `- This component has been the primary failure source in ${graphContext.totalIncidents} previous incident(s).`,
        `- Known blast radius (components it has caused to fail):`
    ];

    for (const edge of graphContext.knownBlastRadius) {
        lines.push(
            `  • ${edge.downstream} — failed ${edge.occurrenceCount}x (last seen: ${new Date(edge.lastSeenAt).toISOString()})`
        );
    }

    lines.push(
        `- Use this historical context to calibrate your confidence score and validate your root cause hypothesis.`
    );

    return lines.join("\n");
}