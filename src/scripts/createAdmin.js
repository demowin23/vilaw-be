const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const createAdmin = async () => {
  try {
    console.log("👨‍💼 Creating admin account...");

    // Thông tin admin mặc định
    const adminData = {
      phone: "0123456789",
      email: "admin@vilaw.com",
      fullName: "Administrator",
      password: "admin123",
      role: "admin",
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Kiểm tra admin đã tồn tại chưa
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE phone = $1 OR email = $2",
      [adminData.phone, adminData.email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log("⚠️  Admin account already exists");
      return;
    }

    // Tạo admin
    const result = await pool.query(
      `INSERT INTO users (phone, email, full_name, password, role, is_phone_verified, is_email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, true, true, true)
       RETURNING id, phone, email, full_name, role, ts_create`,
      [
        adminData.phone,
        adminData.email,
        adminData.fullName,
        hashedPassword,
        adminData.role,
      ]
    );

    const admin = result.rows[0];

    console.log("✅ Admin account created successfully!");
    console.log("\n📋 Admin Details:");
    console.log(`- ID: ${admin.id}`);
    console.log(`- Phone: ${admin.phone}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Full Name: ${admin.full_name}`);
    console.log(`- Role: ${admin.role}`);
    console.log(`- Password: ${adminData.password}`);
    console.log(`- Created: ${admin.ts_create}`);
    console.log("\n🔗 You can now login with these credentials");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

// Run the function
createAdmin();
