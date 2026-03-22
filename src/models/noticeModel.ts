import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid"; // Optional: npm install nanoid for unique slugs

// ---------------- TYPES ----------------

export type NoticePriority = "NORMAL" | "URGENT";
export type TargetAudience = "ALL" | "JUDGES" | "REGISTRY" | "GUESTS";

interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

interface IEventDetails {
  startDate: Date;
  endDate?: Date;
  venue: string;
  organizer: string;
  agenda?: string[];
}

interface IStats {
  views: number;
  downloads: number;
}

export interface INotice extends Document {
  title: string;
  description: string;
  priority: NoticePriority;
  targetAudience: TargetAudience;
  eventDetails?: IEventDetails;
  attachments: IAttachment[];
  publishDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  stats: IStats;
  slug: string;
}

// ---------------- SCHEMA ----------------

const NoticeSchema: Schema<INotice> = new Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Notice description is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "URGENT"],
      default: "NORMAL",
    },
    targetAudience: {
      type: String,
      enum: ["ALL", "JUDGES", "REGISTRY", "GUESTS"],
      default: "ALL",
    },
    eventDetails: {
      startDate: { type: Date },
      endDate: { type: Date },
      venue: { type: String, trim: true },
      organizer: { type: String, trim: true, default: "ORHC Registry" },
      agenda: [{ type: String }],
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        fileSize: { type: Number },
      },
    ],
    publishDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    stats: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- MIDDLEWARE (ASYNC) ----------------

/**
 * Modern Async Pre-Save Hook
 * Avoids next() by returning a Promise (implicitly via async)
 */
NoticeSchema.pre("save", async function () {
  // Only generate slug if title is modified or slug is missing
  if (this.isModified("title") || !this.slug) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    
    // Add a short unique ID to prevent collisions (e.g., "notice-title-xJ2k")
    this.slug = `${baseSlug}-${nanoid(4)}`;
  }
});

// ---------------- INDEXES ----------------

NoticeSchema.index({ title: "text", description: "text" });
NoticeSchema.index({ priority: 1, publishDate: -1 });
NoticeSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INotice>("Notice", NoticeSchema);