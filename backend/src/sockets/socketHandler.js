const onlineUsers = new Map(); // userId -> socketId
import { User } from "../models/user.model.js";

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Step 1: Setup user
    socket.on("setup", async (userId) => {
      socket.join(userId); // personal room
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
      });
      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("online");
    });

    // Step 2: Join specific chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Step 3: Send new message
    socket.on("send-message", ({ chatId, message }) => {
      socket.to(chatId).emit("new-message", message);
      console.log(message);
    });

    socket.on("edit-message", ({ chatId, messageId, content }) => {
      socket.to(chatId).emit("message-edited", { messageId, content });
    });

    socket.on("delete-message", ({ chatId, messageId }) => {
      socket.to(chatId).emit("message-deleted", { messageId });
    });

    // Step 4: Mark as seen
    // socket/socketHandler.js

    socket.on("message-seen", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && !message.read) {
          message.read = true;
          message.readAt = new Date();
          await message.save();
        }

        socket.to(message.chat.toString()).emit("message-seen", {
          messageId,
          readAt: message.readAt,
        });
      } catch (err) {
        console.error("Socket read error:", err.message);
      }
    });

    // Step 5: Typing indicators
    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("typing");
    });

    socket.on("stop-typing", ({ chatId }) => {
      socket.to(chatId).emit("stop-typing");
    });

    // Step 6: Disconnect
    socket.on("disconnect", async () => {
      let disconnectedUserId;
      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("online-users", Array.from(onlineUsers.keys()));
      }
      console.log("❌ Disconnected:", socket.id);
    });
  });
};
