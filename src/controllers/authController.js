const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendRegistrationOTP,
  sendLoginOTP,
  sendResetPasswordOTP,
  verifyOTP,
} = require("../services/otpService");

// @desc    Gửi OTP đăng ký
// @route   POST /api/v1/auth/send-registration-otp
// @access  Public
const sendRegistrationOTPController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại là bắt buộc",
      });
    }

    // Validate số điện thoại Việt Nam
    const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại không hợp lệ",
      });
    }

    const result = await sendRegistrationOTP(phone);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Đăng ký tài khoản với OTP
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { phone, otp, fullName, email, password } = req.body;

    // Validate required fields
    if (!phone || !otp || !fullName) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại, OTP và họ tên là bắt buộc",
      });
    }

    // Xác thực OTP
    const otpVerification = await verifyOTP(phone, otp, "register");
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        error: otpVerification.message,
      });
    }

    // Hash password nếu có
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Tạo user mới (chỉ role 'user')
    const result = await pool.query(
      `INSERT INTO users (phone, email, full_name, password, role, is_phone_verified)
       VALUES ($1, $2, $3, $4, 'user', true)
       RETURNING id, phone, email, full_name, role, is_phone_verified, ts_create`,
      [phone, email || null, fullName, hashedPassword]
    );

    const user = result.rows[0];

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isPhoneVerified: user.is_phone_verified,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
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

// @desc    Gửi OTP đăng nhập
// @route   POST /api/v1/auth/send-login-otp
// @access  Public
const sendLoginOTPController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại là bắt buộc",
      });
    }

    const result = await sendLoginOTP(phone);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error sending login OTP:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Đăng nhập bằng OTP
// @route   POST /api/v1/auth/login-otp
// @access  Public
const loginWithOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại và OTP là bắt buộc",
      });
    }

    // Xác thực OTP
    const otpVerification = await verifyOTP(phone, otp, "login");
    if (!otpVerification.valid) {
      return res.status(400).json({
        success: false,
        error: otpVerification.message,
      });
    }

    // Lấy thông tin user
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND is_active = true",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Tài khoản không tồn tại hoặc đã bị khóa",
      });
    }

    const user = result.rows[0];

    // Cập nhật last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isPhoneVerified: user.is_phone_verified,
        isEmailVerified: user.is_email_verified,
      },
    });
  } catch (error) {
    console.error("Error logging in with OTP:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Đăng nhập bằng password (cho admin/lawyer)
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Số điện thoại và mật khẩu là bắt buộc",
      });
    }

    // Lấy user với password
    const result = await pool.query(
      "SELECT * FROM users WHERE phone = $1 AND is_active = true",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Thông tin đăng nhập không chính xác",
      });
    }

    const user = result.rows[0];

    // Kiểm tra password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: "Tài khoản này chưa có mật khẩu, vui lòng đăng nhập bằng OTP",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Thông tin đăng nhập không chính xác",
      });
    }

    // Cập nhật last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isPhoneVerified: user.is_phone_verified,
        isEmailVerified: user.is_email_verified,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, phone, email, full_name, role, is_phone_verified, is_email_verified, avatar, address, date_of_birth, gender, last_login, ts_create FROM users WHERE id = $1",
      [req.user.id]
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
        isPhoneVerified: user.is_phone_verified,
        isEmailVerified: user.is_email_verified,
        avatar: user.avatar,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        lastLogin: user.last_login,
        createdAt: user.ts_create,
      },
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Cập nhật profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, avatar, address, dateOfBirth, gender } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           avatar = COALESCE($3, avatar),
           address = COALESCE($4, address),
           date_of_birth = COALESCE($5, date_of_birth),
           gender = COALESCE($6, gender),
           ts_update = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, phone, email, full_name, role, avatar, address, date_of_birth, gender`,
      [fullName, email, avatar, address, dateOfBirth, gender, req.user.id]
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
      message: "Cập nhật profile thành công",
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatar: user.avatar,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

// @desc    Đăng xuất
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi server",
    });
  }
};

module.exports = {
  sendRegistrationOTPController,
  register,
  sendLoginOTPController,
  loginWithOTP,
  login,
  getMe,
  updateProfile,
  logout,
};
