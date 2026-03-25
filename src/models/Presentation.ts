import { Schema, model, Document } from "mongoose";

export interface IPresentation extends Document {
  title: string;
  description?: string;
  fileUrl: string;
  downloadUrl: string;   // URL used for the tracking redirect/proxy
  publicId: string;
  fileType: "image" | "video" | "raw";
  mimeType: string;
  fileName: string;
  fileSize: number;
  downloadCount: number; // Field to track total downloads
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
  },
  { 
    timestamps: true 
  }
);

// Indexing for faster retrieval by ID and sorting by popularity/date
presentationSchema.index({ publicId: 1 });
presentationSchema.index({ downloadCount: -1 });

export const Presentation = model<IPresentation>(
  "Presentation",
  presentationSchema
);