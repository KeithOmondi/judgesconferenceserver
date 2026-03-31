import { Schema, model, Document } from "mongoose";

export const PRESENTATION_ROLES = ["judge", "dr", "admin", "all"] as const;
export type PresentationRole = (typeof PRESENTATION_ROLES)[number];

export interface IPresentation extends Document {
  title: string;
  description?: string;
  fileUrl: string;
  downloadUrl: string;
  publicId: string;
  fileType: "image" | "video" | "raw";
  mimeType: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  targetAudience: PresentationRole[];
  createdAt: Date;
  updatedAt: Date;
}

const presentationSchema = new Schema<IPresentation>(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    fileUrl: { 
      type: String, 
      required: true 
    },
    downloadUrl: { 
      type: String, 
      required: true 
    },
    publicId: { 
      type: String, 
      required: true 
    },
    fileType: {
      type: String,
      required: true,
      enum: ["image", "video", "raw"],
    },
    mimeType: { 
      type: String, 
      required: true 
    },
    fileName: { 
      type: String, 
      required: true 
    },
    fileSize: { 
      type: Number, 
      required: true 
    },
    downloadCount: { 
      type: Number, 
      default: 0 
    },
    targetAudience: {
      type: [String],
      enum: PRESENTATION_ROLES,
      default: [],              // empty = visible to all via null-safe filter
    },
  },
  { 
    timestamps: true 
  }
);

presentationSchema.index({ publicId: 1 });
presentationSchema.index({ downloadCount: -1 });
presentationSchema.index({ targetAudience: 1 });

export const Presentation = model<IPresentation>(
  "Presentation",
  presentationSchema
);