const { Pool } = require("pg");

// Tạo connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "vilaw_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

const fixVideoCommentsTable = async () => {
  try {
    console.log("🔧 Sửa bảng video_comments...");

    const client = await pool.connect();

    // Kiểm tra cột is_active trong video_comments
    console.log("📋 Kiểm tra cột is_active trong video_comments...");
    const checkIsActive = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'video_comments' 
      AND column_name = 'is_active';
    `);

    if (checkIsActive.rows.length === 0) {
      console.log("🔧 Thêm cột is_active vào video_comments...");
      await client.query(`
        ALTER TABLE video_comments 
        ADD COLUMN is_active BOOLEAN DEFAULT true
      `);
      console.log("✅ Đã thêm cột is_active");
    } else {
      console.log("✅ Cột is_active đã tồn tại");
    }

    // Kiểm tra cột like_count trong video_comments
    console.log("📋 Kiểm tra cột like_count trong video_comments...");
    const checkLikeCount = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'video_comments' 
      AND column_name = 'like_count';
    `);

    if (checkLikeCount.rows.length === 0) {
      console.log("🔧 Thêm cột like_count vào video_comments...");
      await client.query(`
        ALTER TABLE video_comments 
        ADD COLUMN like_count INTEGER DEFAULT 0
      `);
      console.log("✅ Đã thêm cột like_count");
    } else {
      console.log("✅ Cột like_count đã tồn tại");
    }

    // Kiểm tra cột ts_update trong video_comments
    console.log("📋 Kiểm tra cột ts_update trong video_comments...");
    const checkTsUpdate = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'video_comments' 
      AND column_name = 'ts_update';
    `);

    if (checkTsUpdate.rows.length === 0) {
      console.log("🔧 Thêm cột ts_update vào video_comments...");
      await client.query(`
        ALTER TABLE video_comments 
        ADD COLUMN ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log("✅ Đã thêm cột ts_update");
    } else {
      console.log("✅ Cột ts_update đã tồn tại");
    }

    // Hiển thị cấu trúc bảng video_comments
    console.log("\n📊 Cấu trúc bảng video_comments:");
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'video_comments'
      ORDER BY ordinal_position;
    `);

    columns.rows.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} ${
          col.is_nullable === "YES" ? "NULL" : "NOT NULL"
        } ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`
      );
    });

    client.release();
    console.log("\n✅ Hoàn thành sửa bảng video_comments!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await pool.end();
  }
};

fixVideoCommentsTable();
