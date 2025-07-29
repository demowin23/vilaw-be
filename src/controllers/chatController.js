const { pool } = require("../config/database");
const Chat = require("../models/Chat");

// Lấy danh sách cuộc trò chuyện
const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.getConversations(
      req.user.id,
      req.user.role
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách cuộc trò chuyện",
    });
  }
};

// Lấy tin nhắn của cuộc trò chuyện
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Chat.getMessages(conversationId, req.user.id);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy tin nhắn",
    });
  }
};

// Tạo cuộc trò chuyện mới
const createConversation = async (req, res) => {
  try {
    const { title } = req.body;

    // Kiểm tra xem user đã có cuộc trò chuyện chung chưa
    const existingQuery = `
      SELECT id FROM conversations 
      WHERE user_id = $1 AND lawyer_id IS NULL AND status = 'active'
    `;
    const existingResult = await pool.query(existingQuery, [req.user.id]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Bạn đã có cuộc trò chuyện với luật sư",
        conversationId: existingResult.rows[0].id,
      });
    }

    // Tạo cuộc trò chuyện chung (không có lawyer_id cụ thể)
    const conversation = await Chat.createGeneralConversation(
      req.user.id,
      title
    );

    res.status(201).json({
      success: true,
      message: "Tạo cuộc trò chuyện thành công",
      data: conversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tạo cuộc trò chuyện",
    });
  }
};

// Gửi tin nhắn
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = "text" } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Nội dung tin nhắn là bắt buộc",
      });
    }

    // Kiểm tra quyền truy cập cuộc trò chuyện
    const checkQuery = `
      SELECT * FROM conversations 
      WHERE id = $1 AND status = 'active'
    `;
    const checkResult = await pool.query(checkQuery, [conversationId]);

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Không tìm thấy cuộc trò chuyện này",
      });
    }

    const conversation = checkResult.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // Kiểm tra quyền gửi tin nhắn
    // User chỉ có thể gửi tin nhắn trong cuộc trò chuyện của mình
    // Lawyer có thể gửi tin nhắn trong bất kỳ cuộc trò chuyện nào
    if (userRole === "user" && conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền gửi tin nhắn trong cuộc trò chuyện này",
      });
    }

    // Lawyer và admin có thể gửi tin nhắn trong bất kỳ cuộc trò chuyện nào
    if (
      userRole !== "lawyer" &&
      userRole !== "admin" &&
      conversation.user_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền gửi tin nhắn trong cuộc trò chuyện này",
      });
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/chat/${req.file.filename}`;
    }

    const message = await Chat.sendMessage(
      conversationId,
      userId,
      content,
      messageType,
      fileUrl
    );

    res.status(201).json({
      success: true,
      message: "Gửi tin nhắn thành công",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi gửi tin nhắn",
    });
  }
};

// Lấy danh sách luật sư có sẵn
const getAvailableLawyers = async (req, res) => {
  try {
    const lawyers = await Chat.getAvailableLawyers();

    res.json({
      success: true,
      data: lawyers,
    });
  } catch (error) {
    console.error("Error getting available lawyers:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách luật sư",
    });
  }
};

// Cập nhật trạng thái online
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    await Chat.updateOnlineStatus(req.user.id, isOnline);

    res.json({
      success: true,
      message: "Cập nhật trạng thái online thành công",
    });
  } catch (error) {
    console.error("Error updating online status:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật trạng thái online",
    });
  }
};

// Đánh dấu tin nhắn đã đọc
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Chat.markAsRead(conversationId, req.user.id);

    res.json({
      success: true,
      message: "Đánh dấu tin nhắn đã đọc thành công",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi đánh dấu tin nhắn đã đọc",
    });
  }
};

// Lấy thống kê chat (cho admin)
const getChatStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem thống kê",
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT cm.id) as total_messages,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_conversations,
        COUNT(DISTINCT CASE WHEN cm.is_read = false THEN cm.id END) as unread_messages
      FROM conversations c
      LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
    `;

    const statsResult = await pool.query(statsQuery);

    res.json({
      success: true,
      data: statsResult.rows[0],
    });
  } catch (error) {
    console.error("Error getting chat stats:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy thống kê chat",
    });
  }
};

// Lấy tất cả cuộc trò chuyện (cho lawyer và admin)
const getAllConversations = async (req, res) => {
  try {
    // Kiểm tra quyền
    if (req.user.role !== "lawyer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ luật sư và admin mới có quyền xem tất cả cuộc trò chuyện",
      });
    }

    const { page = 1, limit = 20, status = "active" } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        c.status,
        c.user_id,
        u.full_name as user_name,
        u.avatar as user_avatar,
        u.phone as user_phone,
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
        ) as last_message,
        (
          SELECT COUNT(*) 
          FROM chat_messages cm 
          WHERE cm.conversation_id = c.id
        ) as total_messages
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = $2
      ORDER BY c.updated_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations c
      WHERE c.status = $1
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [req.user.id, status, limit, offset]),
      pool.query(countQuery, [status]),
    ]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting all conversations:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách cuộc trò chuyện",
    });
  }
};

// Lấy tin nhắn của cuộc trò chuyện (cho lawyer và admin)
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Kiểm tra quyền
    if (req.user.role !== "lawyer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ luật sư và admin mới có quyền xem tin nhắn",
      });
    }

    // Kiểm tra cuộc trò chuyện có tồn tại không
    const checkQuery = `
      SELECT c.*, u.full_name as user_name, u.phone as user_phone
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [conversationId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy cuộc trò chuyện",
      });
    }

    const conversation = checkResult.rows[0];

    // Lấy tin nhắn
    const messagesQuery = `
      SELECT 
        cm.*,
        u.full_name as sender_name,
        u.avatar as sender_avatar,
        u.role as sender_role,
        u.phone as sender_phone
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.conversation_id = $1
      ORDER BY cm.created_at ASC
    `;

    const messagesResult = await pool.query(messagesQuery, [conversationId]);

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          status: conversation.status,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          user: {
            id: conversation.user_id,
            name: conversation.user_name,
            phone: conversation.user_phone,
          },
        },
        messages: messagesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy tin nhắn",
    });
  }
};

// Lấy thống kê chat chi tiết (Admin only)
const getDetailedChatStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem thống kê chi tiết",
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(DISTINCT cm.id) as total_messages,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_conversations,
        COUNT(DISTINCT CASE WHEN cm.is_read = false THEN cm.id END) as unread_messages,
        COUNT(DISTINCT c.user_id) as unique_users,
        COUNT(DISTINCT CASE WHEN u.role = 'lawyer' THEN u.id END) as total_lawyers,
        COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as total_admins
      FROM conversations c
      LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
      LEFT JOIN users u ON u.role IN ('lawyer', 'admin')
    `;

    const recentActivityQuery = `
      SELECT 
        c.id as conversation_id,
        c.title,
        u.full_name as user_name,
        u.phone as user_phone,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_time
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN chat_messages cm ON c.id = cm.conversation_id
      WHERE c.status = 'active'
      GROUP BY c.id, c.title, u.full_name, u.phone
      ORDER BY last_message_time DESC
      LIMIT 10
    `;

    const [statsResult, activityResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(recentActivityQuery),
    ]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        recent_activity: activityResult.rows,
      },
    });
  } catch (error) {
    console.error("Error getting detailed chat stats:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy thống kê chat",
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  getAvailableLawyers,
  updateOnlineStatus,
  markAsRead,
  getChatStats,
  getAllConversations,
  getConversationMessages,
  getDetailedChatStats,
};
