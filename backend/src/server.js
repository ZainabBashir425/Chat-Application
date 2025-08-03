import dotenv from "dotenv";
dotenv.config({
    path:'./env' 
});

import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./sockets/socketHandler.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// connect DB
connectDB();

// Create server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

initSocket(io);

const PORT = process.env.PORT || 8006;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
