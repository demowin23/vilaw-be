const { pool } = require("../config/database");
require("dotenv").config();

const resetLegalNews = async () => {
  try {
    console.log("🗑️ Bắt đầu xóa và tạo lại bảng legal_news...");

    const client = await pool.connect();

    // Xóa bảng legal_news nếu tồn tại
    console.log("📋 Xóa bảng legal_news cũ...");
    await client.query(`
      DROP TABLE IF EXISTS legal_news CASCADE
    `);

    // Tạo lại bảng legal_news với trường author_id, status, tags, image (TEXT)
    console.log("🔨 Tạo bảng legal_news mới...");
    await client.query(`
      CREATE TABLE legal_news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        image TEXT,
        view_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        tags TEXT[],
        author_id INTEGER REFERENCES users(id),
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo indexes
    console.log("📊 Tạo indexes...");
    await client.query(`
      CREATE INDEX idx_news_title ON legal_news(title);
      CREATE INDEX idx_news_view_count ON legal_news(view_count);
      CREATE INDEX idx_news_ts_create ON legal_news(ts_create);
      CREATE INDEX idx_news_status ON legal_news(status);
      CREATE INDEX idx_news_tags ON legal_news USING GIN(tags);
      CREATE INDEX idx_news_author_id ON legal_news(author_id);
    `);

    client.release();

    console.log("✅ Hoàn thành xóa và tạo lại bảng legal_news!");
    console.log("📋 Bảng đã được tạo với các trường:");
    console.log("   - id: SERIAL PRIMARY KEY");
    console.log("   - title: VARCHAR(300) NOT NULL");
    console.log("   - content: TEXT NOT NULL");
    console.log("   - description: TEXT");
    console.log("   - image: TEXT (lưu đường dẫn ảnh upload)");
    console.log("   - view_count: INTEGER DEFAULT 0");
    console.log("   - status: VARCHAR(20) DEFAULT 'pending'");
    console.log("   - tags: TEXT[]");
    console.log("   - author_id: INTEGER REFERENCES users(id)");
    console.log("   - ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("   - ts_update: TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  } catch (error) {
    console.error("❌ Lỗi khi reset bảng legal_news:", error);
  } finally {
    await pool.end();
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  resetLegalNews();
}

module.exports = resetLegalNews;
