const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");

// @desc    Lấy danh sách tất cả users (Admin only)
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, is_active, limit = 10, offset = 0, search } = req.query;

    let query = `
      SELECT id, phone, email, full_name, role, is_active, is_phone_verified, 
             is_email_verified, avatar, address, date_of_birth, gender, 
             last_login, ts_create, ts_update
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === "true");
    }

    if (search) {
      paramCount++;
      query += ` AND (full_name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY ts_create DESC LIMIT $${paramCount + 1} OFFSET $${
      paramCount + 2
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Đếm tổng số records
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (is_active !== undefined) {
      countParamCount++;
      countQuery += ` AND is_active = $${countParamCount}`;
      countParams.push(is_active === "true");
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (full_name ILIKE $${countParamCount} OR phone ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      total,
      data: result.rows.map((user) => ({
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        isPhoneVerified: user.is_phone_verified,
        isEmailVerified: user.is_email_verified,
        avatar: user.avatar,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        lastLogin: user.last_login,
        createdAt: user.ts_create,
        updatedAt: user.ts_update,
      })),
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Lấy thông tin user theo ID (Admin only)
// @route   GET /api/v1/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, phone, email, full_name, role, is_active, is_phone_verified, 
              is_email_verified, avatar, address, date_of_birth, gender, 
              last_login, ts_create, ts_update
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy user",
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        isPhoneVerified: user.is_phone_verified,
        isEmailVerified: user.is_email_verified,
        avatar: user.avatar,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        lastLogin: user.last_login,
        createdAt: user.ts_create,
        updatedAt: user.ts_update,
      },
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Tạo user mới (Admin only)
// @route   POST /api/v1/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const {
      phone,
      email,
      fullName,
      password,
      role,
      address,
      dateOfBirth,
      gender,
    } = req.body;

    // Validate required fields
    if (!phone || !fullName) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại và họ tên là bắt buộc",
      });
    }

    // Validate role
    if (role && !["admin", "lawyer", "user", "collaborator"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Role không hợp lệ",
      });
    }

    // Hash password nếu có
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Tạo user mới
    const result = await pool.query(
      `INSERT INTO users (phone, email, full_name, password, role, address, date_of_birth, gender, is_phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, phone, email, full_name, role, is_phone_verified, ts_create`,
      [
        phone,
        email || null,
        fullName,
        hashedPassword,
        role || "user",
        address,
        dateOfBirth,
        gender,
      ]
    );

    const user = result.rows[0];

    // Log admin action
    await pool.query(
      `INSERT INTO admin_management (admin_id, action_type, target_user_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "create_user",
        user.id,
        JSON.stringify({ phone, email, fullName, role }),
        req.ip,
        req.get("User-Agent"),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Tạo user thành công",
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isPhoneVerified: user.is_phone_verified,
        createdAt: user.ts_create,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({
        success: false,
        error: "Số điện thoại hoặc email đã được sử dụng",
      });
    }
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Cập nhật user (Admin only)
// @route   PUT /api/v1/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      fullName,
      password,
      role,
      isActive,
      address,
      dateOfBirth,
      gender,
    } = req.body;

    // Kiểm tra user có tồn tại không
    const checkResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy user",
      });
    }

    const oldUser = checkResult.rows[0];

    // Hash password nếu có
    let hashedPassword = oldUser.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Cập nhật user
    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           password = COALESCE($3, password),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           address = COALESCE($6, address),
           date_of_birth = COALESCE($7, date_of_birth),
           gender = COALESCE($8, gender),
           ts_update = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, phone, email, full_name, role, is_active, is_phone_verified, ts_update`,
      [
        email,
        fullName,
        hashedPassword,
        role,
        isActive,
        address,
        dateOfBirth,
        gender,
        id,
      ]
    );

    const user = result.rows[0];

    // Log admin action
    await pool.query(
      `INSERT INTO admin_management (admin_id, action_type, target_user_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "update_user",
        user.id,
        JSON.stringify({
          oldData: {
            email: oldUser.email,
            fullName: oldUser.full_name,
            role: oldUser.role,
            isActive: oldUser.is_active,
          },
          newData: {
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            isActive: user.is_active,
          },
        }),
        req.ip,
        req.get("User-Agent"),
      ]
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật user thành công",
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        isPhoneVerified: user.is_phone_verified,
        updatedAt: user.ts_update,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Xóa user (Admin only)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra user có tồn tại không
    const checkResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy user",
      });
    }

    const user = checkResult.rows[0];

    // Không cho phép xóa chính mình
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "Không thể xóa tài khoản của chính mình",
      });
    }

    // Soft delete - set is_active = false
    await pool.query(
      "UPDATE users SET is_active = false, ts_update = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO admin_management (admin_id, action_type, target_user_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "delete_user",
        user.id,
        JSON.stringify({
          phone: user.phone,
          fullName: user.full_name,
          role: user.role,
        }),
        req.ip,
        req.get("User-Agent"),
      ]
    );

    res.status(200).json({
      success: true,
      message: "Xóa user thành công",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Thay đổi role user (Admin only)
// @route   PUT /api/v1/admin/users/:id/change-role
// @access  Private (Admin)
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "lawyer", "user", "collaborator"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Role không hợp lệ",
      });
    }

    // Kiểm tra user có tồn tại không
    const checkResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy user",
      });
    }

    const oldUser = checkResult.rows[0];

    // Không cho phép thay đổi role của chính mình
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "Không thể thay đổi role của chính mình",
      });
    }

    // Cập nhật role
    const result = await pool.query(
      `UPDATE users 
       SET role = $1, ts_update = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, phone, full_name, role, ts_update`,
      [role, id]
    );

    const user = result.rows[0];

    // Log admin action
    await pool.query(
      `INSERT INTO admin_management (admin_id, action_type, target_user_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "change_role",
        user.id,
        JSON.stringify({
          oldRole: oldUser.role,
          newRole: user.role,
          phone: user.phone,
          fullName: user.full_name,
        }),
        req.ip,
        req.get("User-Agent"),
      ]
    );

    res.status(200).json({
      success: true,
      message: "Thay đổi role thành công",
      data: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        updatedAt: user.ts_update,
      },
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Lấy lịch sử admin actions
// @route   GET /api/v1/admin/actions
// @access  Private (Admin)
const getAdminActions = async (req, res) => {
  try {
    const { action_type, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT am.id, am.action_type, am.details, am.ip_address, am.user_agent, am.ts_create,
             admin.phone as admin_phone, admin.full_name as admin_name,
             target.phone as target_phone, target.full_name as target_name
      FROM admin_management am
      LEFT JOIN users admin ON am.admin_id = admin.id
      LEFT JOIN users target ON am.target_user_id = target.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (action_type) {
      paramCount++;
      query += ` AND am.action_type = $${paramCount}`;
      params.push(action_type);
    }

    query += ` ORDER BY am.ts_create DESC LIMIT $${paramCount + 1} OFFSET $${
      paramCount + 2
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map((action) => ({
        id: action.id,
        actionType: action.action_type,
        details: action.details,
        ipAddress: action.ip_address,
        userAgent: action.user_agent,
        createdAt: action.ts_create,
        admin: {
          phone: action.admin_phone,
          fullName: action.admin_name,
        },
        targetUser: action.target_phone
          ? {
              phone: action.target_phone,
              fullName: action.target_name,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error getting admin actions:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  getAdminActions,
};
