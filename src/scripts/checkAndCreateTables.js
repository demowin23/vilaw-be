const { pool } = require("../config/database");

const checkAndCreateTables = async () => {
  try {
    console.log("🔍 Kiểm tra và tạo các bảng còn thiếu...");

    const client = await pool.connect();

    // Kiểm tra và tạo bảng video_likes
    console.log("📋 Kiểm tra bảng video_likes...");
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

    // Kiểm tra và tạo bảng video_comments
    console.log("📋 Kiểm tra bảng video_comments...");
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

    // Kiểm tra và tạo bảng video_comment_likes
    console.log("📋 Kiểm tra bảng video_comment_likes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);

    // Kiểm tra và thêm cột dislike_count vào bảng video_life_law
    console.log("📋 Kiểm tra cột dislike_count...");
    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0
      `);
    } catch (error) {
      console.log(
        "⚠️ Cột dislike_count đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Kiểm tra và thêm cột hashtags vào bảng video_life_law
    console.log("📋 Kiểm tra cột hashtags...");
    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS hashtags TEXT[]
      `);
    } catch (error) {
      console.log("⚠️ Cột hashtags đã tồn tại hoặc có lỗi:", error.message);
    }

    // Tạo indexes
    console.log("📊 Tạo indexes...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_video_hashtags ON video_life_law USING GIN(hashtags)",
      "CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_likes_action ON video_likes(action_type)",
      "CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON video_comments(parent_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_comments_active ON video_comments(is_active)",
      "CREATE INDEX IF NOT EXISTS idx_video_comment_likes_comment_id ON video_comment_likes(comment_id)",
      "CREATE INDEX IF NOT EXISTS idx_video_comment_likes_user_id ON video_comment_likes(user_id)",
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`⚠️ Warning creating index: ${error.message}`);
      }
    }

    client.release();
    console.log("✅ Hoàn thành kiểm tra và tạo bảng!");
    console.log("\n📋 Các bảng đã được tạo:");
    console.log("   - video_likes");
    console.log("   - video_comments");
    console.log("   - video_comment_likes");
    console.log("   - Cột dislike_count và hashtags trong video_life_law");
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra và tạo bảng:", error);
  } finally {
    await pool.end();
  }
};

checkAndCreateTables();
