import { causalGraphNodes, causalGraphEdges } from "../../db/schema.js";

export async function getGraphHandler(req, reply) {
    try {
        const nodes = await req.server.db.select().from(causalGraphNodes);
        const edges = await req.server.db.select().from(causalGraphEdges);

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