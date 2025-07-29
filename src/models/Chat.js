const { pool } = require("../config/database");

class Chat {
  // Lấy danh sách cuộc trò chuyện của user
  static async getConversations(userId, userRole) {
    try {
      let query = `
        SELECT DISTINCT 
          c.id,
          c.title,
          c.created_at,
          c.updated_at,
          c.status,
          c.user_id,
          u.full_name as user_name,
          u.avatar as user_avatar,
          u.role as user_role,
          (
            SELECT COUNT(*) 
            FROM chat_messages cm 
            WHERE cm.conversation_id = c.id 
            AND cm.is_read = false 
            AND cm.sender_id != $1
          ) as unread_count,
          (
            SELECT cm.content 
            FROM chat_messages cm 
            WHERE cm.conversation_id = c.id 
            ORDER BY cm.created_at DESC 
            LIMIT 1
          ) as last_message
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.status = 'active'
      `;

      const params = [userId];

      // Nếu là user thường, chỉ xem cuộc trò chuyện của mình
      if (userRole === "user") {
        query += ` AND c.user_id = $1`;
      }
      // Nếu là lawyer hoặc admin, xem tất cả cuộc trò chuyện
      else if (userRole === "lawyer" || userRole === "admin") {
        query += ` AND (c.user_id = $1 OR c.lawyer_id IS NULL)`;
      }

      query += ` ORDER BY c.updated_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tin nhắn của một cuộc trò chuyện
  static async getMessages(conversationId, userId) {
    try {
      // Kiểm tra quyền truy cập
      const checkQuery = `
        SELECT * FROM conversations 
        WHERE id = $1 AND status = 'active'
      `;
      const checkResult = await pool.query(checkQuery, [conversationId]);

      if (checkResult.rows.length === 0) {
        throw new Error("Không có quyền truy cập cuộc trò chuyện này");
      }

      const query = `
        SELECT 
          cm.*,
          u.full_name as sender_name,
          u.avatar as sender_avatar,
          u.role as sender_role
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id
        WHERE cm.conversation_id = $1
        ORDER BY cm.created_at ASC
      `;

      const result = await pool.query(query, [conversationId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo cuộc trò chuyện chung (cho tất cả luật sư)
  static async createGeneralConversation(userId, title = null) {
    try {
      const query = `
        INSERT INTO conversations (user_id, lawyer_id, title, status)
        VALUES ($1, NULL, $2, 'active')
        RETURNING *
      `;

      const result = await pool.query(query, [userId, title]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tạo cuộc trò chuyện mới
  static async createConversation(userId, lawyerId, title = null) {
    try {
      const query = `
        INSERT INTO conversations (user_id, lawyer_id, title, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING *
      `;

      const result = await pool.query(query, [userId, lawyerId, title]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Gửi tin nhắn
  static async sendMessage(
    conversationId,
    senderId,
    content,
    messageType = "text",
    fileUrl = null
  ) {
    try {
      const query = `
        INSERT INTO chat_messages (conversation_id, sender_id, content, message_type, file_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await pool.query(query, [
        conversationId,
        senderId,
        content,
        messageType,
        fileUrl,
      ]);

      // Cập nhật thời gian cuối của conversation
      await pool.query(
        "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [conversationId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Đánh dấu tin nhắn đã đọc
  static async markAsRead(conversationId, userId) {
    try {
      const query = `
        UPDATE chat_messages 
        SET is_read = true 
        WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false
      `;

      await pool.query(query, [conversationId, userId]);
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách luật sư có sẵn
  static async getAvailableLawyers() {
    try {
      const query = `
        SELECT id, full_name, avatar, role, is_online
        FROM users 
        WHERE role IN ('lawyer', 'admin') AND is_active = true
        ORDER BY is_online DESC, full_name ASC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái online
  static async updateOnlineStatus(userId, isOnline) {
    try {
      const query = `
        UPDATE users 
        SET is_online = $2, last_seen = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await pool.query(query, [userId, isOnline]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Chat;
