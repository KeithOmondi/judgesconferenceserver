import mongoose, { Schema, Document } from "mongoose";

// --- Enums ---
export type AudienceRole = "judge" | "dr" | "all";

// --- Interfaces ---
export interface IActivity {
  time: string;
  activity: string;
  facilitator?: string;
  session_chair?: string;
}

export interface IDaySchedule {
  day: string;
  date: Date;
  session_chairs?: string[];
  activities: IActivity[];
}

export interface IProgram extends Document {
  event_title: string;
  theme?: string;
  schedule: IDaySchedule[];
  programFileUrl?: string;
  scheduledRelease: Date;
  isLocked: boolean;
  targetAudience: AudienceRole;   // <-- NEW
  createdAt: Date;
  updatedAt: Date;
}

// --- Sub-schemas ---
const ActivitySchema = new Schema<IActivity>(
  {
    time:          { type: String, required: true },
    activity:      { type: String, required: true },
    facilitator:   { type: String, default: null },
    session_chair: { type: String, default: null },
  },
  { _id: false }
);

const DayScheduleSchema = new Schema<IDaySchedule>({
  day:            { type: String, required: true },
  date:           { type: Date,   required: true },
  session_chairs: [{ type: String }],
  activities:     [ActivitySchema],
});

// --- Main schema ---
const ProgramSchema = new Schema<IProgram>(
  {
    event_title: {
      type:     String,
      required: true,
      default:  "HIGH COURT LEADERS 2026 CONFERENCE",
    },
    theme: {
      type:    String,
      default: "PROTECTING VULNERABLE WOMEN AND CHILDREN: STRENGTHENING JUDICIAL INTERVENTION FOR ACCESS TO JUSTICE",
    },
    schedule: {
      type:    [DayScheduleSchema],
      default: [],
    },
    programFileUrl: {
      type:    String,
      default: null,
    },
    scheduledRelease: {
      type:     Date,
      required: true,
      default:  Date.now,
    },
    isLocked: {
      type:    Boolean,
      default: false,
    },

    // --- Target Audience ---
    targetAudience: {
      type:     String,
      enum:     ["judge", "dr", "all"] satisfies AudienceRole[],
      required: true,
      default:  "all",   // safe fallback — visible to everyone unless narrowed
    },
  },
  {
    timestamps: true,
  }
);

// --- Indexes ---
ProgramSchema.index({ scheduledRelease: 1 });
ProgramSchema.index({ targetAudience: 1 });   // fast filtering by role

export const Program =
  mongoose.models.Program ||
  mongoose.model<IProgram>("Program", ProgramSchema);