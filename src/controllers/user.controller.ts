import { Request, Response } from "express";
import { User, UserRole } from "../models/user.model";

/* =====================================
    👤 GET PROFILE
===================================== */
export const getProfile = async (req: Request, res: Response) => {
  try {
    // req.user.id is recognized globally now
    const user = await User.findById(req.user?.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Officer not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: "Profile retrieval failed" });
  }
};

/* =====================================
    ✏️ UPDATE PROFILE (Self-Service)
===================================== */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, pj, cohort } = req.body;
    const updates: any = {};

    if (name) updates.name = name.trim();
    if (pj) updates.pj = pj.trim();
    if (cohort !== undefined)
      updates.cohort = cohort === "" ? null : Number(cohort);

    const user = await User.findByIdAndUpdate(req.user?.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* =====================================
    🧾 ADMIN — GET ALL USERS
===================================== */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.cohort) filter.cohort = Number(req.query.cohort);
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ cohort: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users || [],
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Registry retrieval failed" });
  }
};

/* =====================================
    🔎 ADMIN — GET USER BY ID
===================================== */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error fetching user" });
  }
};

/* =====================================
    ➕ ADMIN — CREATE NEW USER
===================================== */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, pj, email, password, role, cohort } = req.body;

    // Validation
    if (!name || !pj || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, PJ Number, Email, and Password are required",
      });
    }

    // Updated Roles Check (admin, judge, dr)
    const validRoles: UserRole[] = ["admin", "judge", "dr"];
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role assigned" });
    }

    // Duplicate Check
    const existingUser = await User.findOne({
      $or: [{ pj: pj.trim() }, { email: email.toLowerCase().trim() }],
    });

    if (existingUser) {
      const field = existingUser.pj === pj.trim() ? "PJ Number" : "Email";
      return res
        .status(400)
        .json({ success: false, message: `${field} already in use` });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password, // Will be hashed by User Model pre-save hook
      pj: pj.trim(),
      role,
      cohort: cohort ? Number(cohort) : undefined,
      isVerified: false, // Force password change for DRs
    });

    const { password: _, ...userObject } = newUser.toObject();

    return res.status(201).json({ success: true, user: userObject });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Failed to create user",
      });
  }
};

/* =====================================
    🛠 ADMIN — EDIT USER (Dedicated)
===================================== */
export const editUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, pj, cohort, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });

    const updates: any = {};

    if (name) updates.name = name.trim();
    if (isActive !== undefined) updates.isActive = isActive;
    if (role) updates.role = role;

    // Email Duplicate Check
    if (email && email.toLowerCase() !== user.email?.toLowerCase()) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
      });
      if (emailExists)
        return res
          .status(400)
          .json({ success: false, message: "Email already taken" });
      updates.email = email.toLowerCase().trim();
    }

    // PJ Duplicate Check
    if (pj && pj !== user.pj) {
      const pjExists = await User.findOne({ pj: pj.trim() });
      if (pjExists)
        return res
          .status(400)
          .json({ success: false, message: "PJ Number conflict" });
      updates.pj = pj.trim();
    }

    if (cohort !== undefined)
      updates.cohort = cohort === "" ? null : Number(cohort);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Registry modification failed" });
  }
};

/* =====================================
    ❌ ADMIN — DELETE USER
===================================== */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Deletion failed" });
  }
};

/* =====================================
    🔔 SUBSCRIBE TO WEB PUSH
===================================== */
export const subscribeToPush = async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint)
      return res.status(400).json({ message: "Invalid subscription" });

    await User.findByIdAndUpdate(req.user?.id, {
      $addToSet: { webPushSubscriptions: subscription },
    });

    return res.status(200).json({ message: "Secure Registry alerts enabled." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to link browser" });
  }
};

/* =====================================
    🛠 ADMIN — UPDATE USER
===================================== */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const allowedUpdates: any = {};

    // 1. Map fields from body to the update object
    if (req.body.name) allowedUpdates.name = req.body.name.trim();
    if (req.body.pj) allowedUpdates.pj = req.body.pj.trim();

    // 2. Role Validation (admin, judge, dr)
    if (req.body.role && ["admin", "judge", "dr"].includes(req.body.role)) {
      allowedUpdates.role = req.body.role;
    }

    // 3. Status and Cohort
    if (req.body.isActive !== undefined) {
      allowedUpdates.isActive = req.body.isActive;
    }

    if (req.body.cohort !== undefined) {
      allowedUpdates.cohort = req.body.cohort === "" ? null : Number(req.body.cohort);
    }

    // 4. Execute Update
    const user = await User.findByIdAndUpdate(id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User record not found" 
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    console.error("🔥 [UPDATE-USER] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update user record",
    });
  }
};
