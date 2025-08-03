import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  editMessage,
  deleteMessage
} from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/:chatId")
  .get(verifyJWT, getMessages);
router.route("/:messageId").put(verifyJWT, markMessagesAsRead);
router.put("/edit/:messageId", verifyJWT, editMessage);
router.delete("/:messageId", verifyJWT, deleteMessage);


router
  .route("/")
  .post(verifyJWT, upload.single("file"), sendMessage); // text or file

export default router;
