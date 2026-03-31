import mongoose, { Schema, Document } from "mongoose";

// --- Enums & Types ---
export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";
export type AudienceRole = "judge" | "dr" | "all";

// --- Interfaces ---
export interface IDivisionContent {
  type: ContentType;
  body?: string;
  url?: string;
  publicId?: string;
  fileName?: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface IDivision extends Document {
  name: string;
  title: string;
  description?: string;
  order: number;
  content: IDivisionContent[];
  targetAudience: AudienceRole; // Controlled visibility
  createdAt: Date;
  updatedAt: Date;
}

// --- 1. Content Sub-Schema ---
const contentSchema = new Schema<IDivisionContent>(
  {
    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "FILE"],
      required: true,
    },
    body: { type: String, trim: true },
    url: { type: String },
    publicId: { type: String },
    fileName: { type: String },
    thumbnailUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// --- 2. Main Division Schema ---
const divisionSchema = new Schema<IDivision>(
  {
    name: {
      type: String,
      required: [true, "Official name is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Official title is required (e.g., Registrar High Court)"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    content: {
      type: [contentSchema],
      default: [],
    },
    targetAudience: {
      type: String,
      enum: ["judge", "dr", "all"] satisfies AudienceRole[],
      required: true,
      default: "all",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// --- 3. Indexes ---
// Critical for sorting lists and filtering visibility efficiently
divisionSchema.index({ order: 1 });
divisionSchema.index({ targetAudience: 1 });

// --- 4. Export Model ---
const Division = 
  mongoose.models.Division || 
  mongoose.model<IDivision>("Division", divisionSchema);

export default Division;