const { pool } = require("../config/database");

async function updateChatSchema() {
  try {
    console.log("🔄 Đang cập nhật schema chat...");

    // Cập nhật bảng conversations để cho phép lawyer_id NULL
    const updateConversationsTable = `
      ALTER TABLE conversations 
      ALTER COLUMN lawyer_id DROP NOT NULL;
    `;

    // Thêm comment để giải thích
    const addComment = `
      COMMENT ON COLUMN conversations.lawyer_id IS 'NULL cho cuộc trò chuyện chung với tất cả luật sư';
    `;

    // Thực thi các câu lệnh
    await pool.query(updateConversationsTable);
    console.log("✅ Đã cập nhật bảng conversations cho phép lawyer_id NULL");

    try {
      await pool.query(addComment);
      console.log("✅ Đã thêm comment cho bảng conversations");
    } catch (error) {
      console.log("⚠️ Không thể thêm comment (có thể PostgreSQL không hỗ trợ)");
    }

    console.log("🎉 Cập nhật schema chat thành công!");
    console.log("📝 Lưu ý: Hệ thống chat mới cho phép:");
    console.log(
      "   - Người dùng tạo cuộc trò chuyện chung (không chọn luật sư cụ thể)"
    );
    console.log("   - Tin nhắn tự động gửi đến tất cả luật sư");
    console.log("   - Bất kỳ luật sư nào cũng có thể trả lời");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật schema chat:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  updateChatSchema()
    .then(() => {
      console.log("✅ Hoàn thành cập nhật schema chat");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Lỗi:", error);
      process.exit(1);
    });
}

module.exports = updateChatSchema;
