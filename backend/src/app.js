import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

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


export default app;
