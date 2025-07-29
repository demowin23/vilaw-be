const express = require("express");
const router = express.Router();

const {
  getLegalFields,
  getLegalFieldById,
  getLegalFieldBySlug,
  createLegalField,
  updateLegalField,
  deleteLegalField,
  deletePermanentLegalField,
  getLegalFieldsForDropdown,
  approveLegalField,
  getPendingLegalFields,
} = require("../controllers/legalFieldController");

const { auth, authorize } = require("../middleware/auth");

// Routes công khai (không cần authentication)
router.get("/", getLegalFields);
router.get("/dropdown", getLegalFieldsForDropdown);
router.get("/:id", getLegalFieldById);
router.get("/slug/:slug", getLegalFieldBySlug);

// Routes bảo vệ (cần authentication)
router.post("/", auth, authorize("admin", "lawyer"), createLegalField);
router.put("/:id", auth, authorize("admin", "lawyer"), updateLegalField);
router.delete("/:id", auth, authorize("admin", "lawyer"), deleteLegalField);

// Route xóa vĩnh viễn (chỉ admin)
router.delete(
  "/:id/permanent",
  auth,
  authorize("admin"),
  deletePermanentLegalField
);

// Routes approval (Admin only)
router.get("/admin/pending", auth, authorize("admin"), getPendingLegalFields);
router.put("/admin/:id/approve", auth, authorize("admin"), approveLegalField);

module.exports = router;
