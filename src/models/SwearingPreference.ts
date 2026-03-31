import mongoose, { Schema, Document, Types } from "mongoose";

/* ================================
    Constants & Types
================================ */
export const USER_ROLES = ["judge", "dr", "admin", "all"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/* ================================
    Sub-document Interfaces
================================ */
export interface IJudgeEntry {
  _id: Types.ObjectId;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  targetAudience: UserRole[];
}

export interface IPresentationEntry {
  _id: Types.ObjectId;
  title: string;
  fileUrl: string;
  fileType: string;
  publicId: string;
  resourceType: string;
  uploadedAt: Date;
  targetAudience: UserRole[];
}

/* ================================
    Main Document Interface
=============================== */
export interface ICourtInformation extends Document {
  judges: IJudgeEntry[];
  presentations: IPresentationEntry[];
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/* ================================
    Sub-schemas
================================ */
const JudgeSchema = new Schema<IJudgeEntry>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, default: null },
    targetAudience: {
      type: [String],
      enum: USER_ROLES,
      default: [],              // ← was ["all"]; empty = visible to all via null-safe filter
    },
  },
  { _id: true }
);

const PresentationSchema = new Schema<IPresentationEntry>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: null },
    publicId: { type: String, default: null },
    resourceType: { type: String, default: null },
    uploadedAt: { type: Date, default: Date.now },
    targetAudience: {
      type: [String],
      enum: USER_ROLES,
      default: [],              // ← was ["all"]; same reasoning
    },
  },
  { _id: true }
);

/* ================================
    Main Schema
================================ */
const CourtInformationSchema = new Schema<ICourtInformation>(
  {
    judges: { 
      type: [JudgeSchema], 
      default: [] 
    },
    presentations: { 
      type: [PresentationSchema], 
      default: [] 
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ================================
    Indexes
================================ */
CourtInformationSchema.index({ "judges.targetAudience": 1 });
CourtInformationSchema.index({ "presentations.targetAudience": 1 });

/* ================================
    Export
================================ */
export const CourtInformation =
  mongoose.models.CourtInformation ||
  mongoose.model<ICourtInformation>("CourtInformation", CourtInformationSchema);