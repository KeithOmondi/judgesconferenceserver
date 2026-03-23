import mongoose, { Schema, Document } from "mongoose";

export interface IActivity {
  time: string;
  activity: string;
  facilitator?: string;
  // Added to support session chairs tied to specific activities/times
  session_chair?: string; 
}

export interface IDaySchedule {
  day: string; // e.g., "ONE", "TWO" [cite: 16, 27, 43, 52, 66]
  date: Date;
  session_chairs?: string[]; // General list for the day
  activities: IActivity[];
}

export interface IProgram extends Document {
  event_title: string;
  theme?: string; // Added to capture the conference theme [cite: 5, 71]
  schedule: IDaySchedule[];
  programFileUrl?: string; 
  scheduledRelease: Date;  
  isLocked: boolean;       
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  time: { type: String, required: true },
  activity: { type: String, required: true },
  facilitator: { type: String, default: null },
  session_chair: { type: String, default: null } // Supporting granular chair data
}, { _id: false });

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
      default: "HIGH COURT LEADERS 2026 CONFERENCE" // Updated default [cite: 4, 15, 41, 70]
    },
    theme: {
      type: String,
      default: "PROTECTING VULNERABLE WOMEN AND CHILDREN: STRENGTHENING JUDICIAL INTERVENTION FOR ACCESS TO JUSTICE" // [cite: 5, 71]
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
      default: Date.now 
    },
    isLocked: {
      type: Boolean,
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

ProgramSchema.index({ scheduledRelease: 1 });

export const Program = mongoose.models.Program || mongoose.model<IProgram>("Program", ProgramSchema);