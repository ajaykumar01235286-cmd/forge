import { pool } from "../db/Client.js";
export async function healthRoute(app){
    app.get("/health",async () => {
        let dbStatus = "unknown";
        try {
            await pool.query("SELECT 1");
            dbStatus ="connected";

        }
        catch (error) {dbStatus = "disconnected";}
        return{
            status: "ok",
            service: "Forge Api",
            database: dbStatus,
            time: new Date().toISOString()
        };
    });
}