import { buildApp } from "./app.js";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 5000;
async function start (){
    const app = buildApp();
    try{
        await app.listen({port: PORT});
        console.log(`Forge Api running on port ${PORT}`);
    }catch (err) {app.log.error(err);process.exit(1);}
}


start();