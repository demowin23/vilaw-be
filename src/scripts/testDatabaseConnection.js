const { pool } = require("../config/database");

const testDatabaseConnection = async () => {
  try {
    console.log("🔍 Kiểm tra kết nối database...");
    console.log("📋 Thông tin kết nối:");
    console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME || "vilaw_db"}`);
    console.log(`   User: ${process.env.DB_USER || "postgres"}`);
    console.log(
      `   Password: ${process.env.DB_PASSWORD ? "***" : "undefined"}`
    );

    const client = await pool.connect();
    console.log("✅ Kết nối database thành công!");

    // Test query đơn giản
    const result = await client.query("SELECT NOW() as current_time");
    console.log(`⏰ Thời gian hiện tại: ${result.rows[0].current_time}`);

    client.release();
  } catch (error) {
    console.error("❌ Lỗi kết nối database:", error.message);
    console.log("💡 Hãy kiểm tra:");
    console.log("   1. PostgreSQL đã được cài đặt và chạy");
    console.log("   2. Database 'vilaw_db' đã được tạo");
    console.log("   3. User và password trong file .env");
    console.log("   4. File .env đã được tạo từ env.example");
  } finally {
    await pool.end();
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = testDatabaseConnection;
