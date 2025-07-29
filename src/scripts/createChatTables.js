const { pool } = require("../config/database");

async function createChatTables() {
  try {
    console.log("🔄 Đang tạo bảng chat...");

    // Tạo bảng conversations
    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lawyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tạo bảng chat_messages
    const createChatMessagesTable = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Thêm cột is_online và last_seen vào bảng users nếu chưa có
    const addOnlineColumns = `
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'is_online') THEN
          ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'last_seen') THEN
          ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `;

    // Tạo indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_lawyer_id ON conversations(lawyer_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);
      CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
    `;

    // Thực thi các câu lệnh
    await pool.query(createConversationsTable);
    console.log("✅ Bảng conversations đã được tạo");

    await pool.query(createChatMessagesTable);
    console.log("✅ Bảng chat_messages đã được tạo");

    await pool.query(addOnlineColumns);
    console.log("✅ Cột is_online và last_seen đã được thêm vào bảng users");

    await pool.query(createIndexes);
    console.log("✅ Indexes đã được tạo");

    console.log("🎉 Tất cả bảng chat đã được tạo thành công!");

    // Tạo thư mục uploads/chat nếu chưa có
    const fs = require("fs");
    const path = require("path");
    const chatUploadPath = path.join(__dirname, "../../uploads/chat");

    if (!fs.existsSync(chatUploadPath)) {
      fs.mkdirSync(chatUploadPath, { recursive: true });
      console.log("✅ Thư mục uploads/chat đã được tạo");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo bảng chat:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  createChatTables()
    .then(() => {
      console.log("✅ Script tạo bảng chat hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script tạo bảng chat thất bại:", error);
      process.exit(1);
    });
}

module.exports = createChatTables;
