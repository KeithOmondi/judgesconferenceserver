import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getPublicEvents,
  getPublicEventById,
} from "../controllers/eventController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router();

/* ===============================
   AUTHENTICATED USERS (Judges, DR, Admin)
================================ */

// Get scoped events based on user role (filter handled in controller)
router.get("/get", protect, getEvents);

// Get single event with audience verification
router.get("/get/:id", protect, getEventById);

/* ===============================
   ADMIN ONLY: MANAGEMENT
================================ */

// Create event with optional image
router.post(
  "/create", 
  protect, 
  authorize("admin"), 
  upload.single("image"), 
  createEvent
);

// Update event with optional image
router.put(
  "/update/:id", 
  protect, 
  authorize("admin"), 
  upload.single("image"), 
  updateEvent
);

// Delete event from registry
router.delete("/delete/:id", protect, authorize("admin"), deleteEvent);

/* ===============================
   PUBLIC / UNPROTECTED ROUTES
   (If "guest" is removed, these should allow anyone or specific roles)
================================ */

// Use this if you want judges/dr to see a "Public Calendar" 
// without specific audience scoping logic applied.
router.get("/public", protect, authorize("judge", "dr"), getPublicEvents);
router.get("/public/:id", protect, authorize("judge", "dr"), getPublicEventById);

export default router;