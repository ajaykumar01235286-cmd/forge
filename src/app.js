import Fastify from "fastify";
import multipart from "@fastify/multipart";
import dbPlugin from "./plugins/db.js";
import { healthRoute } from "./routes/health.js";
import incidentRoutes from "./modules/incidents/incident.routes.js";
import analysisRoutes from "./modules/analysis/analysis.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";

export function buildApp(){
    const app = Fastify({
        logger: true
    });
    app.register(multipart);
    app.register(dbPlugin);
    app.register(healthRoute);
    app.register(incidentRoutes, {prefix: "/incidents"});
    app.register(analysisRoutes);
    app.register(reportRoutes , {prefix: "/reports"});
    return app;
}