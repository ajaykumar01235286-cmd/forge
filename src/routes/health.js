export async function healthRoute(app){
    app.get("/health",async () => {
        return{
            status: "ok",
            service: "Forge Api",
            time: new Date().toISOString()
        };
    });
}