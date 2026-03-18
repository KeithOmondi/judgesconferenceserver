import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import messageRoutes from "./routes/message.routes";
import userRoutes from "./routes/user.routes";
import filesRoutes from "./routes/file.routes";
import courtInfoRoutes from "./routes/courtInfoRoutes";
import guestsRoutes from "./routes/judgeGuestRoutes";
import noticeRoutes from "./routes/noticeRoutes";
import eventsRoutes from "./routes/eventRoutes";
import swearingPreferenceRoutes from "./routes/swearingPreferenceRoutes";
import gallaryRoutes from "./routes/gallery.routes";
import { env } from "./config/env";
import { protect } from "./middlewares/authMiddleware"; // Ensure this is imported

const app: Application = express();

/**
 * 1. PROXY CONFIGURATION
 */
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/**
 * 2. UPDATED CORS CONFIGURATION
 * This allows both your Web Frontend and your Mobile App (which often has no origin header)
 */
const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    // Allow requests with no origin (Mobile apps, Postman) 
    // or requests matching your FRONTEND_URL
    if (!origin || origin === env.FRONTEND_URL || env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  // Added 'Cookie' to allowed headers for mobile session persistence
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * 3. HEALTH CHECK
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV 
  });
});

/**
 * 4. API ROUTES
 */

// --- ADDED: THE "ME" ROUTE ---
// This is critical for the Redux checkAuth thunk
app.get("/api/v1/auth/me", protect, (req: any, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user, // Ensure 'protect' middleware attaches user to req
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat", messageRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/files", filesRoutes);
app.use("/api/v1/courts", courtInfoRoutes);
app.use("/api/v1/guests", guestsRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/oath/court-info", swearingPreferenceRoutes);
app.use("/api/v1/gallery", gallaryRoutes);

/**
 * 5. ERROR HANDLING
 */
app.use(notFound);
app.use(errorHandler);

export default app;