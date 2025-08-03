import { Router } from "express";
import { accessChat, getUserChats,getUserOnlineStatus } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/status/:userId").get(getUserOnlineStatus);


router.post("/", verifyJWT, accessChat);          // Create/access a chat
router.get("/", verifyJWT, getUserChats);         // Fetch all user's chats

export default router;
