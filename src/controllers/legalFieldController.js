const LegalField = require("../models/LegalField");

// Lấy danh sách lĩnh vực
const getLegalFields = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, is_active } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      is_active:
        is_active === "true" ? true : is_active === "false" ? false : undefined,
    };

    const result = await LegalField.getAll(options);

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      total: result.total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total,
      },
    });
  } catch (error) {
    console.error("Error getting legal fields:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách lĩnh vực",
    });
  }
};

// Lấy chi tiết lĩnh vực
const getLegalFieldById = async (req, res) => {
  try {
    const { id } = req.params;

    const field = await LegalField.getById(id);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    res.json({
      success: true,
      data: field,
    });
  } catch (error) {
    console.error("Error getting legal field by id:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy chi tiết lĩnh vực",
    });
  }
};

// Lấy lĩnh vực theo slug
const getLegalFieldBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const field = await LegalField.getBySlug(slug);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    res.json({
      success: true,
      data: field,
    });
  } catch (error) {
    console.error("Error getting legal field by slug:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy chi tiết lĩnh vực",
    });
  }
};

// Tạo lĩnh vực mới
const createLegalField = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      icon,
      color,
      sort_order = 0,
      is_active = true,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Tên lĩnh vực là bắt buộc",
      });
    }

    // Tạo slug nếu không có
    const finalSlug = slug || LegalField.createSlug(name);

    // Kiểm tra slug đã tồn tại
    const slugExists = await LegalField.checkSlugExists(finalSlug);
    if (slugExists) {
      return res.status(400).json({
        success: false,
        error: "Slug đã tồn tại",
      });
    }

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để tạo lĩnh vực",
      });
    }

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = req.user.role === "admin" ? true : false;

    const fieldData = {
      name,
      slug: finalSlug,
      description,
      icon,
      color,
      sort_order: parseInt(sort_order) || 0,
      created_by: req.user.id,
      is_active,
      is_approved: isApproved,
    };

    const newField = await LegalField.create(fieldData);

    res.status(201).json({
      success: true,
      message: "Tạo lĩnh vực thành công",
      data: newField,
    });
  } catch (error) {
    console.error("Error creating legal field:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tạo lĩnh vực",
    });
  }
};

// Cập nhật lĩnh vực
const updateLegalField = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, color, sort_order, is_active } =
      req.body;

    // Kiểm tra lĩnh vực tồn tại
    const existingField = await LegalField.getById(id);
    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để cập nhật lĩnh vực",
      });
    }

    // Kiểm tra quyền cập nhật
    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      existingField.created_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền cập nhật lĩnh vực này",
      });
    }

    // Kiểm tra slug đã tồn tại (nếu thay đổi)
    if (slug && slug !== existingField.slug) {
      const slugExists = await LegalField.checkSlugExists(slug, id);
      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: "Slug đã tồn tại",
        });
      }
    }

    const updateData = {
      name,
      slug,
      description,
      icon,
      color,
      sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined,
      is_active,
    };

    // Loại bỏ các trường undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedField = await LegalField.update(id, updateData);

    res.json({
      success: true,
      message: "Cập nhật lĩnh vực thành công",
      data: updatedField,
    });
  } catch (error) {
    console.error("Error updating legal field:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật lĩnh vực",
    });
  }
};

// Xóa lĩnh vực
const deleteLegalField = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra lĩnh vực tồn tại
    const existingField = await LegalField.getById(id);
    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    // Kiểm tra quyền xóa
    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      existingField.created_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền xóa lĩnh vực này",
      });
    }

    await LegalField.delete(id);

    res.json({
      success: true,
      message: "Xóa lĩnh vực thành công",
    });
  } catch (error) {
    console.error("Error deleting legal field:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa lĩnh vực",
    });
  }
};

// Xóa vĩnh viễn lĩnh vực
const deletePermanentLegalField = async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ admin mới được xóa vĩnh viễn
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới được xóa vĩnh viễn",
      });
    }

    // Kiểm tra lĩnh vực tồn tại
    const existingField = await LegalField.getById(id);
    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    await LegalField.deletePermanent(id);

    res.json({
      success: true,
      message: "Xóa vĩnh viễn lĩnh vực thành công",
    });
  } catch (error) {
    console.error("Error permanently deleting legal field:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa vĩnh viễn lĩnh vực",
    });
  }
};

// Lấy danh sách lĩnh vực cho dropdown
const getLegalFieldsForDropdown = async (req, res) => {
  try {
    const fields = await LegalField.getForDropdown();
    res.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error getting legal fields for dropdown:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách lĩnh vực",
    });
  }
};

// Duyệt/từ chối lĩnh vực (Admin only)
const approveLegalField = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để duyệt lĩnh vực",
      });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt lĩnh vực",
      });
    }

    // Kiểm tra lĩnh vực tồn tại
    const existingField = await LegalField.getById(id);
    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lĩnh vực",
      });
    }

    // Cập nhật trạng thái approval
    const updatedField = await LegalField.update(id, { is_approved });

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt lĩnh vực thành công"
        : "Từ chối lĩnh vực thành công",
      data: updatedField,
    });
  } catch (error) {
    console.error("Error approving legal field:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt lĩnh vực",
    });
  }
};

// Lấy danh sách lĩnh vực chờ duyệt (Admin only)
const getPendingLegalFields = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, is_active } = req.query;

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để xem danh sách lĩnh vực chờ duyệt",
      });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem danh sách lĩnh vực chờ duyệt",
      });
    }

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      search,
      is_active: is_active === "true",
      is_approved: false, // Chỉ lấy lĩnh vực chưa được duyệt
      include_pending: false,
    };

    const result = await LegalField.getAll(options);

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      total: result.total,
    });
  } catch (error) {
    console.error("Error getting pending legal fields:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách lĩnh vực chờ duyệt",
    });
  }
};

module.exports = {
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
};
