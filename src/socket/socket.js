import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("=================================");
  console.log("SOCKET CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("=================================");
});

socket.on("disconnect", (reason) => {
  console.log("SOCKET DISCONNECTED:", reason);
});

socket.on("connect_error", (error) => {
  console.error(
    "SOCKET CONNECTION ERROR:",
    error.message
  );
});

export default socket;