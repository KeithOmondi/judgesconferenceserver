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
import noticeRoutes from "./routes/noticeRoutes";
import eventsRoutes from "./routes/eventRoutes";
import swearingPreferenceRoutes from "./routes/swearingPreferenceRoutes";
import programRoutes from "./routes/program.routes"
import gallaryRoutes from "./routes/gallery.routes";
import presentationRoutes from "./routes/presentation.routes"
import notificationRoutes from "./routes/notificationRoutes"
import { env } from "./config/env";
import { protect } from "./middlewares/authMiddleware";

const app: Application = express();

/**
 * 1. PROXY CONFIGURATION
 * Crucial for receiving cookies over HTTPS when deployed on platforms like Render/Vercel.
 */
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/**
 * 2. CORS CONFIGURATION
 * Optimized for cross-origin cookie support.
 */
const allowedOrigins = [env.FRONTEND_URL];

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    // Allow requests with no origin (Mobile apps, Postman) 
    // or requests matching allowed list/development mode
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Required for the browser to send cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
};

app.use(cors(corsOptions));
/**
 * CRITICAL FIX FOR 500 ERRORS ON LARGE UPLOADS
 * Increase the limits for built-in parsers 
 */
app.use(express.json({ limit: "60mb" })); 
app.use(express.urlencoded({ limit: "60mb", extended: true }));
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

/* --- THE "ME" ROUTE ---
  Used by your Redux 'refreshUser' or a separate 'checkAuth' thunk.
  This confirms if the browser's cookies are still valid.
*/
app.get("/api/v1/auth/me", protect, (req: any, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user, 
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat", messageRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/files", filesRoutes);
app.use("/api/v1/courts", courtInfoRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/oath/court-info", swearingPreferenceRoutes);
app.use("/api/v1/gallery", gallaryRoutes);
app.use("/api/v1/program", programRoutes);
app.use("/api/v1/presentations", presentationRoutes);
app.use('/api/v1/notifications', notificationRoutes)

/**
 * 5. ERROR HANDLING
 */
app.use(notFound);
app.use(errorHandler);

export default app;