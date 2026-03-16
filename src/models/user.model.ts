import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

/* ================================
  1️⃣ Types & Interfaces
================================ */
export type UserRole = "admin" | "judge" | "guest";

interface IWebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IUser extends Document {
  pj: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;

  cohort?: number; // 👈 NEW (2011, 2012, 2013 etc)

  isVerified: boolean;
  isActive: boolean;

  fcmTokens: string[];
  webPushSubscriptions: IWebPushSubscription[];

  passwordChangedAt?: Date;

  loginAttempts: number;
  lockUntil?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

interface IUserModel extends Model<IUser> {
  failedLogin(email: string): Promise<void>;
}

/* ================================
  2️⃣ Schema Definition
================================ */
const userSchema = new Schema<IUser>(
  {
    pj: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: false,
      minlength: 5,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "judge", "guest"],
      default: "guest",
      index: true,
    },

    /* ================================
       👨‍⚖️ Judge Cohort
       Example: 2011, 2012, 2013
    ================================= */
    cohort: {
      type: Number,
      index: true,
      min: 2000,
      max: 2100,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    fcmTokens: {
      type: [String],
      default: [],
      index: true,
    },

    webPushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        expirationTime: { type: Number, default: null },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
        },
      },
    ],

    passwordChangedAt: Date,

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
  },
  {
    timestamps: true,
  },
);

/* ================================
  3️⃣ Middleware (Password Hashing)
================================ */
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

/* ================================
  4️⃣ Instance Methods
================================ */
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  const userPassword = (this as any).password;

  if (!userPassword) {
    throw new Error(
      "Password not selected. Use .select('+password') in query.",
    );
  }

  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/* ================================
  5️⃣ Static Methods
================================ */
userSchema.statics.failedLogin = async function (email: string) {
  const user = await this.findOne({ email });

  if (!user) return;

  user.loginAttempts += 1;

  if (user.loginAttempts >= 5) {
    // Lock account for 30 minutes
    user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await user.save();
};

/* ================================
  6️⃣ Export Model
================================ */
export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
