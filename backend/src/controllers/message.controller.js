import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// @desc Send a new message
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  let fileData = {};
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path, "chat_files");
    fileData = {
      public_id: uploaded.public_id,
      url: uploaded.secure_url,
      type: req.file.mimetype,
    };
  }

  const message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content:content,
    file: fileData || null,
  });
  const chat = await Chat.findById(chatId);
if (!chat) throw new ApiError(404, "Chat not found");

const otherUserId = chat.members.find(
  (id) => id.toString() !== req.user._id.toString()
);

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    $inc: {
    [`unreadCounts.${req.user._id}`]: 0,
    [`unreadCounts.${otherUserId}`]: 1,
  },
  });

  const populatedMessage = await message.populate("sender", "username avatar");

  res.status(201).json(new ApiResponse(201,populatedMessage,"Message sent succesfully"));
});

// @desc Get all messages for a chat
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "username avatar")
    .sort({ createdAt: 1 });

  res.status(200).json(new ApiResponse(200,messages,"All messages fetched"));
});

// @desc Mark all messages in a chat as read
// controllers/message.controller.js

export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    if (!message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }
    await Chat.findByIdAndUpdate(message.chat, {
  $set: { [`unreadCounts.${req.user._id}`]: 0 }
});

    res.status(200).json(new ApiResponse(200,{data: message }, "Message marked as read" ));
  } catch (err) {
    throw new ApiError(500,err.message)
  }
});

export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404,"Not found");
  if (!message.sender.equals(req.user._id))
    throw new ApiError(403,"Unauthorized")

  message.content = content;
  message.editedAt = new Date();
  await message.save();

  req.app.get("io").to(message.chat.toString()).emit("message-edited", message);

  res.status(200).json(new ApiResponse(200,message,"Message edited Successfully"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404,"Not found");
  if (!message.sender.equals(req.user._id))
    throw new ApiError(403,"Unauthorized")

  req.app.get("io").to(message.chat.toString()).emit("message-deleted", {
  _id: message._id,
  chat: message.chat,
});

  await message.deleteOne();
  res.status(200).json(new ApiResponse(200,"Message Deleted Succesfully"));
});
