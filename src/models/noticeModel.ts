import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";

// ---------------- TYPES ----------------

export type NoticePriority = "NORMAL" | "URGENT";

/**
 * Who this notice is targeted at:
 *  - "ALL"    → Both judges and DRs see it
 *  - "JUDGES" → Only users with role "judge" can see it
 *  - "DR"     → Only users with role "dr" (Deputy Registrar) can see it
 *
 * Access rule enforced in noticeController.getNotices():
 *   judge → query { targetAudience: { $in: ["JUDGES", "ALL"] } }
 *   dr    → query { targetAudience: { $in: ["DR", "ALL"] } }
 *   admin → no filter (sees everything)
 */
export type TargetAudience = "ALL" | "JUDGES" | "DR";

interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
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

    // ✅ Updated: removed "REGISTRY" and "GUESTS", added "DR"
    targetAudience: {
      type: String,
      enum: ["ALL", "JUDGES", "DR"],
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
        fileType: { type: String, required: true },
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

// ---------------- MIDDLEWARE ----------------

NoticeSchema.pre("save", async function (this: INotice) {
  if (this.isModified("title") || !this.slug) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    this.slug = `${baseSlug}-${nanoid(4)}`;
  }
});

// ---------------- INDEXES ----------------

NoticeSchema.index({ title: "text", description: "text" });
NoticeSchema.index({ priority: 1, publishDate: -1 });

// Compound index — the most common query: role-scoped active notices
NoticeSchema.index({ targetAudience: 1, isActive: 1, publishDate: -1 });

// Auto-delete expired notices
NoticeSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INotice>("Notice", NoticeSchema);