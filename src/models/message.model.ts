import { Schema, model, Types, Document } from "mongoose";

export type SenderType = "guest" | "admin" | "judge";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId; // Used for Direct Messages
  group?: Types.ObjectId;    // Used for Group Threads
  text?: string;
  imageUrl?: string;
  senderType: SenderType;
  // Arrays track specific user interactions
  readBy: Types.ObjectId[];
  deliveredTo: Types.ObjectId[];
  isDeleted: boolean;
  isEdited: boolean;
  isBroadcast: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    imageUrl: String,
    senderType: {
      type: String,
      enum: ["guest", "admin", "judge"],
      required: true,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
      index: true,
    },
    // We remove the single 'status' string because it's inaccurate for 
    // broadcasts where 10 people might read and 5 might not.
    readBy: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "User",
        index: true 
      }
    ],
    deliveredTo: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "User" 
      }
    ],
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===============================
    INDEXES FOR UNREAD QUERIES
================================ */
// Optimizes finding unread messages for a specific user
messageSchema.index({ "readBy": 1, "isBroadcast": 1 });
messageSchema.index({ "receiver": 1, "readBy": 1 });

/* ===============================
    VALIDATION
================================ */
messageSchema.pre("validate", function (this: IMessage) {
  if (this.isBroadcast) {
    if (!this.text && !this.imageUrl) {
      throw new Error("Broadcast must contain either text or an image.");
    }
    return;
  }

  if (!this.receiver && !this.group) {
    throw new Error("Standard messages require a receiver or a group.");
  }
  
  if (this.receiver && this.group) {
    throw new Error("Message cannot target both a private receiver and a group.");
  }

  if (!this.text && !this.imageUrl) {
    throw new Error("Message body cannot be empty.");
  }
});

export const Message = model<IMessage>("Message", messageSchema);