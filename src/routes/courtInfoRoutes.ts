import express from "express";
import {
  getCourtInfo,
  createDivision,
  updateDivision,
  deleteDivision,
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/courtInfoController";
import { authorize, protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router();

/* =====================================================
    SHARED ROUTES (DRs & JUDGES)
    The controller filters content based on user role.
===================================================== */

// Get all court data (Divisions, FAQs, Contacts) in one call
router.get("/all", protect, getCourtInfo);

// Individual collection fetches
router.get("/faqs", protect, getFAQs);
router.get("/contacts", protect, getContacts);


/* =====================================================
    ADMIN ONLY ROUTES (CRUD Operations)
===================================================== */

/**
 * DIVISIONS
 * Handles multipart/form-data for media uploads.
 */
router.post(
  "/divisions",
  protect,
  authorize("admin"),
  upload.single("file"), 
  createDivision
);

router.put(
  "/divisions/:id",
  protect,
  authorize("admin"),
  upload.single("file"),
  updateDivision
);

router.delete(
  "/divisions/:id", 
  protect, 
  authorize("admin"), 
  deleteDivision
);

/**
 * FAQS
 */
router.post("/faqs", protect, authorize("admin"), createFAQ);
router.put("/faqs/:id", protect, authorize("admin"), updateFAQ);
router.delete("/faqs/:id", protect, authorize("admin"), deleteFAQ);

/**
 * CONTACTS
 */
router.post("/contacts", protect, authorize("admin"), createContact);
router.put("/contacts/:id", protect, authorize("admin"), updateContact);
router.delete("/contacts/:id", protect, authorize("admin"), deleteContact);

export default router;