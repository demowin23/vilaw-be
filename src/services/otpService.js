const twilio = require("twilio");
const { pool } = require("../config/database");

// Khởi tạo Twilio client (chỉ trong production)
let twilioClient = null;
if (
  process.env.NODE_ENV === "production" &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Tạo OTP code ngẫu nhiên 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua SMS
const sendOTP = async (phone, otpCode, purpose) => {
  try {
    // Trong môi trường development, chỉ log OTP thay vì gửi SMS thật
    if (process.env.NODE_ENV === "development") {
      console.log(`📱 OTP for ${phone}: ${otpCode} (Purpose: ${purpose})`);
      return true;
    }

    // Kiểm tra Twilio client có sẵn không
    if (!twilioClient) {
      console.log(
        `📱 OTP for ${phone}: ${otpCode} (Purpose: ${purpose}) - Twilio not configured`
      );
      return true;
    }

    // Gửi SMS thật qua Twilio
    await twilioClient.messages.create({
      body: `Mã xác thực Vilaw của bạn là: ${otpCode}. Mã có hiệu lực trong 5 phút.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

// Lưu OTP vào database
const saveOTP = async (phone, otpCode, purpose) => {
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await pool.query(
      `INSERT INTO otp_verification (phone, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [phone, otpCode, purpose, expiresAt]
    );

    return true;
  } catch (error) {
    console.error("Error saving OTP:", error);
    return false;
  }
};

// Xác thực OTP
const verifyOTP = async (phone, otpCode, purpose) => {
  try {
    const result = await pool.query(
      `SELECT * FROM otp_verification 
       WHERE phone = $1 AND otp_code = $2 AND purpose = $3 
       AND is_used = false AND expires_at > NOW()
       ORDER BY ts_create DESC LIMIT 1`,
      [phone, otpCode, purpose]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" };
    }

    // Đánh dấu OTP đã sử dụng
    await pool.query(
      "UPDATE otp_verification SET is_used = true WHERE id = $1",
      [result.rows[0].id]
    );

    return { valid: true, message: "Xác thực OTP thành công" };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { valid: false, message: "Lỗi xác thực OTP" };
  }
};

// Gửi OTP cho đăng ký
const sendRegistrationOTP = async (phone) => {
  try {
    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return { success: false, message: "Số điện thoại đã được đăng ký" };
    }

    const otpCode = generateOTP();
    const saved = await saveOTP(phone, otpCode, "register");

    if (!saved) {
      return { success: false, message: "Lỗi lưu OTP" };
    }

    const sent = await sendOTP(phone, otpCode, "register");

    if (!sent) {
      return { success: false, message: "Lỗi gửi OTP" };
    }

    return {
      success: true,
      message: "OTP đã được gửi đến số điện thoại của bạn",
    };
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    return { success: false, message: "Lỗi gửi OTP" };
  }
};

// Gửi OTP cho đăng nhập
const sendLoginOTP = async (phone) => {
  try {
    // Kiểm tra số điện thoại có tồn tại không
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone = $1 AND is_active = true",
      [phone]
    );

    if (existingUser.rows.length === 0) {
      return { success: false, message: "Số điện thoại chưa được đăng ký" };
    }

    const otpCode = generateOTP();
    const saved = await saveOTP(phone, otpCode, "login");

    if (!saved) {
      return { success: false, message: "Lỗi lưu OTP" };
    }

    const sent = await sendOTP(phone, otpCode, "login");

    if (!sent) {
      return { success: false, message: "Lỗi gửi OTP" };
    }

    return {
      success: true,
      message: "OTP đã được gửi đến số điện thoại của bạn",
    };
  } catch (error) {
    console.error("Error sending login OTP:", error);
    return { success: false, message: "Lỗi gửi OTP" };
  }
};

// Gửi OTP cho reset password
const sendResetPasswordOTP = async (phone) => {
  try {
    // Kiểm tra số điện thoại có tồn tại không
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone = $1 AND is_active = true",
      [phone]
    );

    if (existingUser.rows.length === 0) {
      return { success: false, message: "Số điện thoại chưa được đăng ký" };
    }

    const otpCode = generateOTP();
    const saved = await saveOTP(phone, otpCode, "reset_password");

    if (!saved) {
      return { success: false, message: "Lỗi lưu OTP" };
    }

    const sent = await sendOTP(phone, otpCode, "reset_password");

    if (!sent) {
      return { success: false, message: "Lỗi gửi OTP" };
    }

    return {
      success: true,
      message: "OTP đã được gửi đến số điện thoại của bạn",
    };
  } catch (error) {
    console.error("Error sending reset password OTP:", error);
    return { success: false, message: "Lỗi gửi OTP" };
  }
};

module.exports = {
  sendRegistrationOTP,
  sendLoginOTP,
  sendResetPasswordOTP,
  verifyOTP,
  generateOTP,
};
