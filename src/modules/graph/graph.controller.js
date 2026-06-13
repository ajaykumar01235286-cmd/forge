import { eq } from "drizzle-orm";
import { causalGraphNodes, causalGraphEdges } from "../../db/schema.js";

export async function getGraphHandler(req, reply) {
    try {
        const tenantId = req.user.organizationId;  // text-stored org UUID

        const nodes = await req.server.db
            .select()
            .from(causalGraphNodes)
            .where(eq(causalGraphNodes.tenantId, tenantId));

        const edges = await req.server.db
            .select()
            .from(causalGraphEdges)
            .where(eq(causalGraphEdges.tenantId, tenantId));

        return {
            success: true,
            nodeCount: nodes.length,
            edgeCount: edges.length,
            nodes,
            edges
        };
    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch graph" });
    }
}