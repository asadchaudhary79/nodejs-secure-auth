import express from "express";
const router = express.Router();
import adminController from "../controllers/adminController.js";
import { hasRole, hasAnyRole } from "../middlewares/authMiddleware.js";

// Remove the global admin middleware since we'll use specific role checks
// router.use(isAdmin);

// Get all blocked users - accessible by admin or moderator
router.get(
  "/blocked-users",
  hasAnyRole("admin", "superAdmin"),
  adminController.getBlockedUsers
);

// Unblock a user - only admin can unblock
router.post(
  "/unblock-user/:userId",
  hasRole("admin"),
  adminController.unblockUser
);

// Manually block a user - only admin can block
router.post("/block-user/:userId", hasRole("admin"), adminController.blockUser);

export default router;
