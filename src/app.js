
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import dbPlugin from "./plugins/db.js";
import { healthRoute } from "./routes/health.js";
import incidentRoutes from "./modules/incidents/incident.routes.js";
import analysisRoutes from "./modules/analysis/analysis.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import { graphRoutes } from "./modules/graph/graph.routes.js";
import realtimeRoutes from "./modules/realtime/realtime.routes.js";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

export function buildApp() {
    const app = Fastify({
        logger: true
    });
    app.register(cors, {
        origin: "http://localhost:3000",
        credentials: true
    });
    app.register(multipart);
    app.register(dbPlugin);
    app.register(websocket);

    app.register(healthRoute);
    app.register(incidentRoutes, { prefix: "/incidents" });
    app.register(analysisRoutes);
    app.register(reportRoutes, { prefix: "/reports" });
    app.register(graphRoutes);
    app.register(realtimeRoutes);

    app.register(swagger, {
        openapi: {
            info: {
                title: "Forge API",
                description: "Incident investigation backend",
                version: "0.0.0"
            }
        }
    });
    app.register(swaggerUI, {
        routePrefix: "/docs"
    });

    return app;
}