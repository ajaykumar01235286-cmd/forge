import { joinRoom, leaveRoom } from "../../events/subscriber.js";

export default async function realtimeRoutes(fastify) {
    fastify.get("/ws/incidents/:incidentId", { websocket: true }, (socket, req) => {
        const { incidentId } = req.params;

        joinRoom(incidentId, socket);

        // Send a hello so the client knows it's connected
        socket.send(JSON.stringify({
            type: "connected",
            incidentId,
            message: "Live updates active"
        }));

        socket.on("close", () => leaveRoom(incidentId, socket));
        socket.on("error", () => leaveRoom(incidentId, socket));
    });
}
