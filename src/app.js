import Fastify from "fastify";
import multipart from "@fastify/multipart";
import dbPlugin from "./plugins/db.js";
import { healthRoute } from "./routes/health.js";
import incidentRoutes from "./modules/incidents/incident.routes.js";



export function buildApp(){
    const app = Fastify({
        logger: true
    });
    app.register(multipart);
    app.register(dbPlugin);
    app.register(healthRoute);
    app.register(incidentRoutes, {prefix: "/incidents"});
  
    return app;
}