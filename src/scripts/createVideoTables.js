const { Pool } = require("pg");

// Tạo connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "vilaw_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

const createVideoTables = async () => {
  try {
    console.log("🔧 Tạo các bảng video...");

    const client = await pool.connect();

    // Tạo bảng video_likes
    console.log("📋 Tạo bảng video_likes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_likes (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('like', 'dislike')),
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id)
      )
    `);

    // Tạo bảng video_comments
    console.log("📋 Tạo bảng video_comments...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
        like_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng video_comment_likes
    console.log("📋 Tạo bảng video_comment_likes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);

    // Thêm cột dislike_count và hashtags vào video_life_law
    console.log("📋 Thêm cột dislike_count và hashtags...");
    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0
      `);
    } catch (error) {
      console.log("⚠️ Cột dislike_count:", error.message);
    }

    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS hashtags TEXT[]
      `);
    } catch (error) {
      console.log("⚠️ Cột hashtags:", error.message);
    }

    client.release();
    console.log("✅ Hoàn thành tạo bảng video!");
    console.log("\n📋 Các bảng đã được tạo:");
    console.log("   - video_likes");
    console.log("   - video_comments");
    console.log("   - video_comment_likes");
    console.log("   - Cột dislike_count và hashtags trong video_life_law");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await pool.end();
  }
};

createVideoTables();
