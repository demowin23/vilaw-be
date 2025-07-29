const { Pool } = require("pg");

// Tạo connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "vilaw_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

const createMissingTables = async () => {
  try {
    console.log("🔍 Kiểm tra bảng còn thiếu...");

    const client = await pool.connect();

    // Kiểm tra bảng video_likes
    console.log("📋 Kiểm tra bảng video_likes...");
    const checkVideoLikes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'video_likes'
      );
    `);

    if (!checkVideoLikes.rows[0].exists) {
      console.log("🔧 Tạo bảng video_likes...");
      await client.query(`
        CREATE TABLE video_likes (
          id SERIAL PRIMARY KEY,
          video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('like', 'dislike')),
          ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(video_id, user_id)
        )
      `);
      console.log("✅ Đã tạo bảng video_likes");
    } else {
      console.log("✅ Bảng video_likes đã tồn tại");
    }

    // Kiểm tra cột dislike_count trong video_life_law
    console.log("📋 Kiểm tra cột dislike_count...");
    const checkDislikeCount = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'video_life_law' 
      AND column_name = 'dislike_count';
    `);

    if (checkDislikeCount.rows.length === 0) {
      console.log("🔧 Thêm cột dislike_count...");
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN dislike_count INTEGER DEFAULT 0
      `);
      console.log("✅ Đã thêm cột dislike_count");
    } else {
      console.log("✅ Cột dislike_count đã tồn tại");
    }

    // Kiểm tra cột hashtags trong video_life_law
    console.log("📋 Kiểm tra cột hashtags...");
    const checkHashtags = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'video_life_law' 
      AND column_name = 'hashtags';
    `);

    if (checkHashtags.rows.length === 0) {
      console.log("🔧 Thêm cột hashtags...");
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN hashtags TEXT[]
      `);
      console.log("✅ Đã thêm cột hashtags");
    } else {
      console.log("✅ Cột hashtags đã tồn tại");
    }

    // Liệt kê tất cả bảng video
    console.log("\n📊 Danh sách bảng video hiện có:");
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'video_%'
      ORDER BY table_name;
    `);

    tables.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    client.release();
    console.log("\n✅ Hoàn thành kiểm tra!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await pool.end();
  }
};

createMissingTables();
