import { Request, Response } from "express";
import { User } from "../models/user.model";
import { AuthRequest } from "../middlewares/authMiddleware";

/* =====================================
    👤 GET PROFILE
===================================== */
export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select("-password");

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Officer not found" });
  }

  return res.status(200).json({ success: true, user });
};

/* =====================================
    ✏️ UPDATE PROFILE
===================================== */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const updates: any = {
    name: req.body.name,
    pj: req.body.pj,
  };

  if (req.body.cohort) updates.cohort = req.body.cohort;

  const user = await User.findByIdAndUpdate(req.user!.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return res.status(200).json({ success: true, user });
};

/* =====================================
    🧾 ADMIN — GET ALL USERS
===================================== */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    // Optional filtering by cohort
    if (req.query.cohort) {
      filter.cohort = Number(req.query.cohort);
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ cohort: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users || [],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Registry retrieval failed",
    });
  }
};

/* =====================================
    🔎 ADMIN — GET USER BY ID
===================================== */
export const getUserById = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found" });
  }

  return res.status(200).json({ success: true, user });
};

/* =====================================
    ➕ ADMIN — CREATE NEW USER
===================================== */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, pj, email, password, role, cohort } = req.body;

    if (!name || !pj || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, PJ Number, Email, and Password are required",
      });
    }

    if (!["admin", "judge", "guest"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, judge, or guest",
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ pj: pj.trim() }, { email: email.toLowerCase().trim() }] 
    });

    if (existingUser) {
      const field = existingUser.pj === pj.trim() ? "PJ Number" : "Email";
      return res.status(400).json({
        success: false,
        message: `${field} already in use in the registry`,
      });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password, 
      pj: pj.trim(),
      role,
      cohort: cohort ? Number(cohort) : undefined,
      isActive: true,
      loginAttempts: 0,
    });

    // 5. STRIP PASSWORD USING DESTRUCTURING
    // This bypasses the TS delete error by creating a new object without the password field
    const { password: _, ...userObject } = newUser.toObject();

    return res.status(201).json({
      success: true,
      user: userObject,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create user record",
    });
  }
};

/* =====================================
    🛠 ADMIN — UPDATE USER
===================================== */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const allowedUpdates: any = {};

    if (req.body.name) allowedUpdates.name = req.body.name;
    if (req.body.pj) allowedUpdates.pj = req.body.pj;

    if (req.body.role && ["admin", "judge", "guest"].includes(req.body.role)) {
      allowedUpdates.role = req.body.role;
    }

    if (req.body.isActive !== undefined) {
      allowedUpdates.isActive = req.body.isActive;
    }

    if (req.body.cohort !== undefined) {
      allowedUpdates.cohort = Number(req.body.cohort);
    }

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update user",
    });
  }
};

/* =====================================
    ❌ ADMIN — DELETE USER
===================================== */
export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
};

/* =====================================
    🔔 SUBSCRIBE TO WEB PUSH
===================================== */
export const subscribeToPush = async (req: AuthRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = req.user!.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        message: "Invalid subscription object",
      });
    }

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { webPushSubscriptions: subscription } },
      { returnDocument: "after" }
    );

    return res.status(200).json({
      message: "Secure Registry alerts enabled.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to link browser to Registry",
    });
  }
};

/* =====================================
    ✏️ ADMIN — EDIT USER (Dedicated)
===================================== */
export const editUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, pj, cohort } = req.body;

    // 1. Verify user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Personnel record not found",
      });
    }

    const updates: any = {};

    // 2. Handle Name Update
    if (name) updates.name = name.trim();

    // 3. Handle Email Update with Duplicate Check
    if (email && email.toLowerCase() !== user.email?.toLowerCase()) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase().trim() 
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered to another officer",
        });
      }
      updates.email = email.toLowerCase().trim();
    }

    // 4. Handle PJ Number Update with Duplicate Check
    if (pj && pj !== user.pj) {
      const pjExists = await User.findOne({ pj: pj.trim() });
      if (pjExists) {
        return res.status(400).json({
          success: false,
          message: "PJ Number conflict: Already assigned in registry",
        });
      }
      updates.pj = pj.trim();
    }

    // 5. Handle Cohort (allowing for null/empty to clear it)
    if (cohort !== undefined) {
      updates.cohort = cohort === "" ? null : Number(cohort);
    }

    // 6. Execute Update
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Officer details updated successfully",
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Registry modification failed",
    });
  }
};