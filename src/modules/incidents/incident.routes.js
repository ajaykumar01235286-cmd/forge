import { createIncidentHandler,uploadIncidentFileHandler } from "./incident.controller.js";
export default async function incidentRoutes(fastify){
    fastify.post("/",{
        schema:{
            body:{
                type: "object",
                required: ["title"],
                properties:{
                    title:{type:"string"},
                    description:{type:"string"}
                }
            }
        }
    },createIncidentHandler);
    fastify.post("/:incidentId/files",uploadIncidentFileHandler);
}