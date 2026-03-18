import mongoose, { Schema, Document } from "mongoose";

export interface ICourtInformation extends Document {
  judges: {
    _id: mongoose.Types.ObjectId;
    name: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePublicId: string;
  }[];
  presentations: {
    _id: mongoose.Types.ObjectId;
    title: string;
    fileUrl: string;
    fileType: string; 
    publicId: string;
    resourceType: string; // Store: 'video', 'image', or 'raw'
    uploadedAt: Date;
  }[];
  program: {
    items: {
      time?: string;
      event?: string;
      location?: string;
      iconType?: string;
    }[];
    scheduledRelease: Date | null; 
    programFileUrl?: string;
    programFilePublicId?: string;
    programFileResourceType?: string;
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
        resourceType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    program: {
      items: [
        {
          time: { type: String },
          event: { type: String },
          location: { type: String },
          iconType: { type: String, default: "clock" },
        },
      ],
      scheduledRelease: { type: Date, default: null },
      programFileUrl: { type: String },
      programFilePublicId: { type: String },
      programFileResourceType: { type: String },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CourtInformation || 
  mongoose.model<ICourtInformation>("CourtInformation", CourtInformationSchema);