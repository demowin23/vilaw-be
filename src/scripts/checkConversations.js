const { pool } = require("../config/database");

const checkConversations = async () => {
  try {
    console.log("🔍 Kiểm tra conversations trong database...");

    // Kiểm tra bảng chats
    const chatsResult = await pool.query(`
      SELECT id, title, type, created_by, created_at 
      FROM chats 
      ORDER BY id
    `);

    console.log("📋 Bảng chats:");
    console.table(chatsResult.rows);

    // Kiểm tra bảng chat_messages
    const messagesResult = await pool.query(`
      SELECT id, conversation_id, user_id, content, created_at 
      FROM chat_messages 
      ORDER BY conversation_id, created_at
    `);

    console.log("💬 Bảng chat_messages:");
    console.table(messagesResult.rows);

    // Kiểm tra bảng chat_participants
    const participantsResult = await pool.query(`
      SELECT conversation_id, user_id, role 
      FROM chat_participants 
      ORDER BY conversation_id
    `);

    console.log("👥 Bảng chat_participants:");
    console.table(participantsResult.rows);
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await pool.end();
  }
};

checkConversations();
