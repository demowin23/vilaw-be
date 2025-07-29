const { pool } = require("../config/database");

const addApprovalFields = async () => {
  try {
    console.log("🔍 Thêm các trường approval vào database...");

    const client = await pool.connect();

    // Thêm trường is_approved vào bảng legal_documents
    console.log("📋 Thêm trường is_approved vào bảng legal_documents...");
    try {
      await client.query(`
        ALTER TABLE legal_documents 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Thêm trường is_approved vào bảng legal_news
    console.log("📋 Thêm trường is_approved vào bảng legal_news...");
    try {
      await client.query(`
        ALTER TABLE legal_news 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Thêm trường is_approved vào bảng legal_knowledge
    console.log("📋 Thêm trường is_approved vào bảng legal_knowledge...");
    try {
      await client.query(`
        ALTER TABLE legal_knowledge 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Thêm trường is_approved vào bảng video_life_law
    console.log("📋 Thêm trường is_approved vào bảng video_life_law...");
    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Thêm trường is_approved vào bảng legal_fields
    console.log("📋 Thêm trường is_approved vào bảng legal_fields...");
    try {
      await client.query(`
        ALTER TABLE legal_fields 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Thêm trường is_approved vào bảng category
    console.log("📋 Thêm trường is_approved vào bảng category...");
    try {
      await client.query(`
        ALTER TABLE category 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.log(
        "⚠️ Trường is_approved đã tồn tại hoặc có lỗi:",
        error.message
      );
    }

    // Tạo indexes cho trường is_approved
    console.log("📊 Tạo indexes cho trường is_approved...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_legal_documents_approved ON legal_documents(is_approved)",
      "CREATE INDEX IF NOT EXISTS idx_legal_news_approved ON legal_news(is_approved)",
      "CREATE INDEX IF NOT EXISTS idx_legal_knowledge_approved ON legal_knowledge(is_approved)",
      "CREATE INDEX IF NOT EXISTS idx_video_life_law_approved ON video_life_law(is_approved)",
      "CREATE INDEX IF NOT EXISTS idx_legal_fields_approved ON legal_fields(is_approved)",
      "CREATE INDEX IF NOT EXISTS idx_category_approved ON category(is_approved)",
    ];

    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
      } catch (error) {
        console.log(`⚠️ Warning creating index: ${error.message}`);
      }
    }

    client.release();
    console.log("✅ Hoàn thành thêm các trường approval!");
    console.log("\n📋 Các trường đã được thêm:");
    console.log("- legal_documents.is_approved (BOOLEAN DEFAULT false)");
    console.log("- legal_news.is_approved (BOOLEAN DEFAULT false)");
    console.log("- legal_knowledge.is_approved (BOOLEAN DEFAULT false)");
    console.log("- video_life_law.is_approved (BOOLEAN DEFAULT false)");
    console.log("- legal_fields.is_approved (BOOLEAN DEFAULT false)");
    console.log("- category.is_approved (BOOLEAN DEFAULT false)");
  } catch (error) {
    console.error("❌ Error adding approval fields:", error);
    throw error;
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  addApprovalFields()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

module.exports = addApprovalFields;
