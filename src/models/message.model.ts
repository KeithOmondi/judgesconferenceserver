import { Schema, model, Types, Document } from "mongoose";

// ✅ Updated: added "dr" as a valid sender type
export type SenderType = "admin" | "judge" | "dr";

/**
 * Audience for broadcast messages only.
 * Ignored entirely for direct messages and group messages.
 *
 *  - "JUDGES" → only users with role "judge" receive/see this broadcast
 *  - "DR"     → only users with role "dr" receive/see this broadcast
 *  - "ALL"    → both judges and DRs receive/see this broadcast
 *
 * Access rule enforced in message.controller.ts getBroadcasts():
 *   judge → query { isBroadcast: true, audience: { $in: ["JUDGES", "ALL"] } }
 *   dr    → query { isBroadcast: true, audience: { $in: ["DR", "ALL"] } }
 *   admin → no audience filter (sees all broadcasts for audit purposes)
 */
export type MessageAudience = "ALL" | "JUDGES" | "DR";

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId;  // Direct messages only
  group?: Types.ObjectId;     // Group thread messages only
  text?: string;
  imageUrl?: string;
  senderType: SenderType;

  // Broadcast-specific fields
  isBroadcast: boolean;
  audience?: MessageAudience; // Required when isBroadcast === true

  // Per-user interaction tracking
  readBy: Types.ObjectId[];
  deliveredTo: Types.ObjectId[];

  isDeleted: boolean;
  isEdited: boolean;
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

    // ✅ Updated: added "dr"
    senderType: {
      type: String,
      enum: ["admin", "judge", "dr"],
      required: true,
    },

    isBroadcast: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ✅ New: scopes broadcast visibility — null/undefined for non-broadcasts
    audience: {
      type: String,
      enum: ["ALL", "JUDGES", "DR"],
      default: null,
    },

    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
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
    INDEXES
================================ */
// Broadcast feed queries — role-scoped
messageSchema.index({ isBroadcast: 1, audience: 1, createdAt: -1 });

// Unread broadcast lookup per user
messageSchema.index({ isBroadcast: 1, readBy: 1 });

// DM unread lookup
messageSchema.index({ receiver: 1, readBy: 1 });

/* ===============================
    VALIDATION
================================ */
messageSchema.pre("validate", function (this: IMessage) {
  if (this.isBroadcast) {
    // Broadcasts must declare an audience
    if (!this.audience) {
      throw new Error(
        "Broadcast messages must specify an audience: 'ALL', 'JUDGES', or 'DR'."
      );
    }
    if (!this.text && !this.imageUrl) {
      throw new Error("Broadcast must contain either text or an image.");
    }
    // Broadcasts must not target a specific receiver or group
    if (this.receiver || this.group) {
      throw new Error(
        "Broadcast messages must not target a specific receiver or group."
      );
    }
    return;
  }

  // Standard message rules
  if (!this.receiver && !this.group) {
    throw new Error("Standard messages require a receiver or a group.");
  }

  if (this.receiver && this.group) {
    throw new Error(
      "Message cannot target both a private receiver and a group."
    );
  }

  if (!this.text && !this.imageUrl) {
    throw new Error("Message body cannot be empty.");
  }
});

export const Message = model<IMessage>("Message", messageSchema);