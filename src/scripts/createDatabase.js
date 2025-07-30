const { Pool } = require("pg");

// Kết nối đến PostgreSQL server (không chỉ định database cụ thể)
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
  database: "postgres", // Kết nối đến database mặc định
});

async function createDatabase() {
  try {
    console.log("🔄 Đang kiểm tra và tạo database...");

    // Kiểm tra xem database vilaw_db đã tồn tại chưa
    const checkResult = await pool.query(`
      SELECT 1 FROM pg_database WHERE datname = 'vilaw_db'
    `);

    if (checkResult.rows.length === 0) {
      console.log("📝 Database 'vilaw_db' chưa tồn tại, đang tạo...");

      // Tạo database vilaw_db
      await pool.query(`CREATE DATABASE vilaw_db`);
      console.log("✅ Đã tạo database 'vilaw_db' thành công!");
    } else {
      console.log("✅ Database 'vilaw_db' đã tồn tại!");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo database:", error.message);

    if (error.code === "3D000") {
      console.log(
        "💡 Gợi ý: Hãy đảm bảo PostgreSQL đang chạy và có quyền tạo database"
      );
    }
  } finally {
    await pool.end();
  }
}

// Chạy script
createDatabase();
