import {evidence } from "../../db/schema.js";
import { Queue } from "bullmq";
import IORedis from "ioredis";
const connection = new IORedis({maxRetriesPerRequest: null});
const analysisQueue = new Queue("analysis-queue", {connection});
export async function uploadEvidenceHandler(req, reply){
    try {
        const {incidentId} = req.params;
        const data = await req.file();
        if (!data) return reply.status(400).send({error: "No file provided "});
        const fileBuffer = await data.toBuffer();
        const rawLogText = fileBuffer.toString("utf-8");
        await req.server.db.insert(evidence).values({
            incidentId,
            extractedData: rawLogText
        });
        await analysisQueue.add("analyze-incident", {incidentId});
        return reply.status(201).send({
            sucess: true,
            message: "log file ingesyed. analysis is starting..."
        }) ;
    } catch (error) {
        req.log.error(error);
        return reply.status(500).send({error: " Ingestion failed"});
    }
}