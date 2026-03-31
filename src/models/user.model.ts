import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto"; // Added for token generation

/* ================================
  1️⃣ Types & Interfaces
================================ */
export type UserRole = "admin" | "judge" | "dr";

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
  cohort?: number;
  isVerified: boolean;
  isActive: boolean;

  // SESSION & SECURITY
  fcmTokens: string[];
  webPushSubscriptions: IWebPushSubscription[];
  currentSessionId?: string;
  lastLogin?: Date;

  // PASSWORD RESET FIELDS
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  passwordChangedAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  generateNewSession(): Promise<string>;
  createPasswordResetToken(): string; // New method
}

interface IUserModel extends Model<IUser> {
  failedLogin(email: string): Promise<void>;
}

/* ================================
  2️⃣ Schema Definition
================================ */
const userSchema = new Schema<IUser>(
  {
    pj: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 10, select: false }, // Upped minlength to 10 for safety

    role: {
      type: String,
      enum: ["admin", "judge", "dr"],
      default: "dr",
      index: true,
    },

    cohort: { type: Number, index: true, min: 2000, max: 2100 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },

    currentSessionId: { type: String, default: null },
    lastLogin: { type: Date },

    fcmTokens: { type: [String], default: [], index: true },
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

    passwordResetToken: String,
    passwordResetExpires: Date,

    passwordChangedAt: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  { timestamps: true }
);

/* ================================
  3️⃣ Middleware (Password Hashing)
================================ */
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // If password was changed (and it's not a new user), update passwordChangedAt
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

/* ================================
  4️⃣ Instance Methods
================================ */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const userPassword = (this as any).password;
  if (!userPassword) {
    throw new Error("Password not selected. Use .select('+password') in query.");
  }
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.generateNewSession = async function (): Promise<string> {
  const newSessionId = uuidv4();
  this.currentSessionId = newSessionId;
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
  return newSessionId;
};

/**
 * Creates a plain-text reset token, hashes it for storage, 
 * and returns the plain-text version for email delivery.
 */
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Expires in 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

/* ================================
  5️⃣ Static Methods
================================ */
userSchema.statics.failedLogin = async function (email: string) {
  const user = await this.findOne({ email });
  if (!user) return;

  user.loginAttempts += 1;

  if (user.loginAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
  }

  await user.save();
};

/* ================================
  6️⃣ Export Model
================================ */
export const User = mongoose.model<IUser, IUserModel>("User", userSchema);