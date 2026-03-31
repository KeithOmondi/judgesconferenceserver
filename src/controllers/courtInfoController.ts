import { Request, Response } from "express";
import Division from "../models/divisionModel";
import FAQ from "../models/faqModel";
import Contact from "../models/contactModel";
import { uploadToCloudinary } from "../config/cloudinary";

/**
 * HELPER: Build a resilient role-based filter
 * Returns content matching the role, 'all', OR legacy content with no role set
 */
const getQueryFilter = (req: Request) => {
  // 1. Normalize the incoming role from the user object
  const role = ((req as any).user?.role || "all").toLowerCase();

  if (role === "all" || role === "admin") return {};

  return {
    $or: [
      // 2. Look for the standard lowercase role
      { targetAudience: { $in: [role, "all"] } },
      // 3. Temporarily add the uppercase version to catch these specific records
      { targetAudience: "JUDGES" }, 
      { targetAudience: { $exists: false } }
    ]
  };
};

/* =====================================================
    READ ALL (Unified Court Data - Role Protected)
===================================================== */
export const getCourtInfo = async (req: Request, res: Response) => {
  try {
    const filter = getQueryFilter(req);

    const [divisions, faqs, contacts] = await Promise.all([
      Division.find(filter).sort({ order: 1, createdAt: -1 }),
      FAQ.find(filter).sort({ createdAt: -1 }),
      Contact.find(filter).sort({ title: 1 }),
    ]);

    res.json({ divisions, faqs, contacts });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch court data", error: err.message });
  }
};

/* =====================================================
    DIVISIONS
===================================================== */
export const createDivision = async (req: Request, res: Response) => {
  try {
    const { name, title, description, body, order, targetAudience } = req.body;
    const contentItems = [];

    if (req.file) {
      const result = await uploadToCloudinary(req.file, "court_divisions");
      const mime = req.file.mimetype;
      const type = mime.startsWith("video") ? "VIDEO" : mime.startsWith("image") ? "IMAGE" : "FILE";

      contentItems.push({
        type,
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        body: body || "",
        thumbnailUrl: type === "VIDEO" ? result.eager?.[0]?.secure_url : undefined,
      });
    } else if (body) {
      contentItems.push({ type: "TEXT", body });
    }

    let finalOrder = order;
    if (finalOrder === undefined) {
      const lastDiv = await Division.findOne().sort({ order: -1 });
      finalOrder = lastDiv ? (lastDiv.order || 0) + 1 : 0;
    }

    const division = await Division.create({
      name,
      title,
      description,
      content: contentItems,
      order: finalOrder,
      targetAudience: targetAudience || "all" // Default to all if not specified
    });

    res.status(201).json(division);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create division", error: err.message });
  }
};

export const updateDivision = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, title, description, body, order, swapWith, targetAudience } = req.body;

    const division = await Division.findById(id);
    if (!division) return res.status(404).json({ message: "Division not found" });

    // Swap ordering logic
    if (swapWith) {
      const targetDivision = await Division.findById(swapWith);
      if (targetDivision) {
        const currentOrder = division.order || 0;
        const targetOrder = targetDivision.order || 0;
        division.order = targetOrder;
        targetDivision.order = currentOrder;

        await Promise.all([division.save(), targetDivision.save()]);
        const filter = getQueryFilter(req);
        const allDivisions = await Division.find(filter).sort({ order: 1 });
        return res.json({ message: "Reordered", divisions: allDivisions });
      }
    }

    // Update fields
    if (name) division.name = name;
    if (title) division.title = title;
    if (description) division.description = description;
    if (order !== undefined) division.order = order;
    if (targetAudience) division.targetAudience = targetAudience;

    if (body || req.file) {
        // ... (existing media update logic)
        if (req.file) {
            const result = await uploadToCloudinary(req.file, "court_divisions");
            const isVideo = req.file.mimetype.startsWith("video");
            division.content.push({
              type: isVideo ? "VIDEO" : "IMAGE",
              url: result.secure_url,
              publicId: result.public_id,
              fileName: req.file.originalname,
              body: body || "",
              thumbnailUrl: isVideo ? result.eager?.[0]?.secure_url : undefined,
              createdAt: new Date(),
            });
        } else if (body && division.content.length > 0) {
            division.content[0].body = body;
        } else if (body) {
            division.content.push({ type: "TEXT", body, createdAt: new Date() });
        }
    }

    await division.save();
    res.json(division);
  } catch (err: any) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

export const deleteDivision = async (req: Request, res: Response) => {
  try {
    const division = await Division.findByIdAndDelete(req.params.id);
    if (!division) return res.status(404).json({ message: "Division not found" });
    res.json({ message: "Division deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
};

/* =====================================================
    FAQs & CONTACTS (Role Aware)
===================================================== */

export const getFAQs = async (req: Request, res: Response) => {
    try {
        const faqs = await FAQ.find(getQueryFilter(req)).sort({ createdAt: -1 });
        res.json(faqs);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getContacts = async (req: Request, res: Response) => {
    try {
        const contacts = await Contact.find(getQueryFilter(req)).sort({ title: 1 });
        res.json(contacts);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// Generic Creator/Updater for FAQ/Contact to handle targetAudience
const handleGenericAction = (Model: any, action: "create" | "update") => 
async (req: Request, res: Response) => {
    try {
        const data = action === "create" 
            ? await Model.create(req.body)
            : await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!data) return res.status(404).json({ message: "Item not found" });
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: "Action failed", error: err.message });
    }
};

export const createFAQ = handleGenericAction(FAQ, "create");
export const updateFAQ = handleGenericAction(FAQ, "update");
export const deleteFAQ = async (req: Request, res: Response) => {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
};

export const createContact = handleGenericAction(Contact, "create");
export const updateContact = handleGenericAction(Contact, "update");
export const deleteContact = async (req: Request, res: Response) => {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
};