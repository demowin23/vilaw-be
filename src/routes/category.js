const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const categoryController = require("../controllers/categoryController");

// Public routes (no authentication required)
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes (authentication required)
router.post("/", auth, categoryController.createCategory);
router.put("/:id", auth, categoryController.updateCategory);
router.delete("/:id", auth, categoryController.deleteCategory);

// Routes approval (Admin only)
router.get("/admin/pending", auth, categoryController.getPendingCategories);
router.put("/admin/:id/approve", auth, categoryController.approveCategory);

module.exports = router;
