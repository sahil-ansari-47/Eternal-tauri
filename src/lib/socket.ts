import { io, Socket } from "socket.io-client";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3000";
export const socket: Socket = io(`${backendUrl}`, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
});
