import mongoose, { Schema, Document } from "mongoose";

export interface IGallery extends Document {
  description?: string;
  url: string;
  downloadUrl: string;
  publicId: string;
  resourceType: "image" | "video";
  uploadedBy: mongoose.Types.ObjectId;
  downloadCount: number; // ← Added for consistent tracking
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
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0, // ← Baseline for analytics
    },
  },
  { timestamps: true }
);

// Indexing for rapid lookups and popularity sorting
GallerySchema.index({ publicId: 1 });
GallerySchema.index({ downloadCount: -1 });

export const Gallery = mongoose.model<IGallery>("Gallery", GallerySchema);