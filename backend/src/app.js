import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(express.static("public"))
app.use(cookieParser());

app.use("/api/v1/users", userRoutes); // you can add /auth later too
app.use("/api/v1/chats", chatRoutes)
app.use("/api/v1/messages", messageRoutes);


export default app;
