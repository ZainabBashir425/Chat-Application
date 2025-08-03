import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    public_id: { type: String },
    url: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    file: {
      type: fileSchema,
      default: undefined,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
