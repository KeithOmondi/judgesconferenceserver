import mongoose, { Schema, Document } from "mongoose";

export interface ICourtInformation extends Document {
  // --- BIO SECTION ---
  judges: {
    name: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePublicId: string;
  }[];

  // --- PRESENTATION SECTION ---
  presentations: {
    title: string;
    fileUrl: string;
    fileType: string; 
    publicId: string;
    uploadedAt: Date;
  }[];

  // --- PROGRAM SECTION (Updated) ---
  program: {
    items: {
      time: string;
      event: string;
      location: string;
      iconType?: string;
    }[];
    // New fields for scheduling and file uploads
    scheduledRelease: Date | null; 
    programFileUrl?: string;       // For the uploaded PDF Program
    programFilePublicId?: string;
  };

  updatedBy: mongoose.Types.ObjectId;
}

const CourtInformationSchema: Schema = new Schema(
  {
    judges: [
      {
        name: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        imageUrl: { type: String, required: true },
        imagePublicId: { type: String },
      },
    ],

    presentations: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Updated Program Schema to be an Object rather than just an Array
    program: {
      items: [
        {
          time: { type: String, required: true },
          event: { type: String, required: true },
          location: { type: String },
          iconType: { type: String, default: "clock" },
        },
      ],
      scheduledRelease: { type: Date, default: null },
      programFileUrl: { type: String },
      programFilePublicId: { type: String },
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CourtInformation || 
  mongoose.model<ICourtInformation>("CourtInformation", CourtInformationSchema);