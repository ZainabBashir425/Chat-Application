import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc Create or get existing chat between two users
export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId || req.user._id.toString() === userId.toString()) {
    throw new ApiError(400, "Invalid user ID");
  }

  const existingChat = await Chat.findOne({
    members: { $all: [req.user._id, userId], $size: 2 },
  })
    .populate("members", "-password")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar" },
    });

  if (existingChat)
    return res
      .status(200)
      .json(new ApiResponse(200, existingChat, "Chat fetched successfully"));

  const newChat = await Chat.create({
    members: [req.user._id, userId],
    unreadCounts: {
      [req.user._id]: 0,
      [userId]: 0,
    },
  });

  const populatedChat = await newChat.populate("members", "-password");

  res.status(201).json(new ApiResponse(201, populatedChat, "New chat created"));
});

// @desc Get all chats for current user
export const getUserChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    members: req.user._id,
  })
    .populate("members", "-password")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar" },
    })
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, chats, "All chats fetched"));
});

export const getUserOnlineStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "isOnline lastSeen"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
      "Fetched User status"
    )
  );
});
