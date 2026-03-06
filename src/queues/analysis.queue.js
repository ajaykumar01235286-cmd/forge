import {Queue} from "bullmq";
import IOREDIS from "ioredis";
const connection = new IOREDIS();
export const analysisQueue = new Queue("analysis-queue",{
    connection
});
