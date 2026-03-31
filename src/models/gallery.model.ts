import mongoose, { Schema, Document } from "mongoose";

// Consistent with your other models
export type AudienceRole = "judge" | "dr" | "all";

export interface IGallery extends Document {
  description?: string;
  url: string;
  downloadUrl: string;
  publicId: string;
  resourceType: "image" | "video";
  targetAudience: AudienceRole; // ← Added for role-based filtering
  uploadedBy: mongoose.Types.ObjectId;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ["judge", "dr", "all"],
      default: "all", // ← Default to public
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexing for rapid lookups, popularity, and filtering
GallerySchema.index({ publicId: 1 });
GallerySchema.index({ downloadCount: -1 });
GallerySchema.index({ targetAudience: 1 }); // ← Added index for filter performance

export const Gallery = mongoose.model<IGallery>("Gallery", GallerySchema);