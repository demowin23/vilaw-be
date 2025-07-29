const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  getAdminActions,
} = require("../controllers/adminController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// Tất cả routes đều yêu cầu admin role
router.use(auth, authorize("admin"));

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/change-role", changeUserRole);

// Admin actions history
router.get("/actions", getAdminActions);

module.exports = router;
