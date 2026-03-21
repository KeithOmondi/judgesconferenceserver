import mongoose, { Schema, Document } from "mongoose";

export interface IActivity {
  time: string;
  activity: string;
  facilitator?: string;
}

export interface IDaySchedule {
  day: string; // e.g., "ONE", "TWO"
  date: Date;
  session_chairs?: string[];
  activities: IActivity[];
}

export interface IProgram extends Document {
  event_title: string;
  schedule: IDaySchedule[];
  programFileUrl?: string; // URL for the PDF version
  scheduledRelease: Date;  // The "Truth" for the countdown
  isLocked: boolean;       // Manual override to hide/show
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  time: { type: String, required: true },
  activity: { type: String, required: true },
  facilitator: { type: String, default: null }
}, { _id: false }); // Disable internal IDs for cleaner sub-documents

const DayScheduleSchema = new Schema<IDaySchedule>({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  session_chairs: [{ type: String }],
  activities: [ActivitySchema]
});

const ProgramSchema = new Schema<IProgram>(
  {
    event_title: { 
      type: String, 
      required: true, 
      default: "ANNUAL HIGH COURT RE-TREAT PROGRAMME" 
    },
    schedule: {
      type: [DayScheduleSchema],
      default: []
    },
    programFileUrl: {
      type: String,
      default: null
    },
    scheduledRelease: {
      type: Date,
      required: true,
      default: Date.now // Defaults to immediate release unless specified
    },
    isLocked: {
      type: Boolean,
      default: false // Set to true if you want to manually hide the program
    }
  },
  { 
    timestamps: true 
  }
);

// Indexing the scheduledRelease for faster time-based queries
ProgramSchema.index({ scheduledRelease: 1 });

export const Program = mongoose.models.Program || mongoose.model<IProgram>("Program", ProgramSchema);