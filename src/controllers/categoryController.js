const Category = require("../models/Category");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res
      .status(500)
      .json({ success: false, error: "Lỗi khi lấy danh sách category" });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.getById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Không tìm thấy category" });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error getting category by id:", error);
    res.status(500).json({ success: false, error: "Lỗi khi lấy category" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { value, label, description } = req.body;
    if (!value || !label) {
      return res
        .status(400)
        .json({ success: false, error: "Thiếu value hoặc label" });
    }

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để tạo category",
      });
    }

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = req.user.role === "admin" ? true : false;

    const category = await Category.create({
      value,
      label,
      description,
      is_approved: isApproved,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, error: "Lỗi khi tạo category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, description } = req.body;
    const category = await Category.update(id, { value, label, description });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Không tìm thấy category" });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating category:", error);
    res
      .status(500)
      .json({ success: false, error: "Lỗi khi cập nhật category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.delete(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Không tìm thấy category" });
    }
    res.json({ success: true, message: "Xóa category thành công" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, error: "Lỗi khi xóa category" });
  }
};

// Duyệt/từ chối category (Admin only)
const approveCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để duyệt category",
      });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt category",
      });
    }

    // Kiểm tra category tồn tại
    const existingCategory = await Category.getById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy category",
      });
    }

    // Cập nhật trạng thái approval
    const updatedCategory = await Category.update(id, { is_approved });

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt category thành công"
        : "Từ chối category thành công",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error approving category:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt category",
    });
  }
};

// Lấy danh sách category chờ duyệt (Admin only)
const getPendingCategories = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem danh sách category chờ duyệt",
      });
    }

    const categories = await Category.getPending();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error getting pending categories:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách category chờ duyệt",
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  approveCategory,
  getPendingCategories,
};
