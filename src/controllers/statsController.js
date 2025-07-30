const { pool } = require("../config/database");

// Thống kê tổng hợp - đếm số lượng record của tất cả loại dữ liệu
const getOverallStats = async (req, res) => {
  try {
    // Đếm users
    const userQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN role = 'lawyer' THEN 1 END) as lawyer_count,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'collaborator' THEN 1 END) as collaborator_count
      FROM users
    `;

    // Đếm legal knowledge
    const knowledgeQuery = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles
      FROM legal_knowledge
    `;

    // Đếm legal documents
    const documentQuery = `
      SELECT 
        COUNT(*) as total_documents,
        SUM(download_count) as total_downloads
      FROM legal_documents
    `;

    // Đếm legal news
    const newsQuery = `
      SELECT 
        COUNT(*) as total_news,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_news
      FROM legal_news
    `;

    // Đếm videos
    const videoQuery = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(view_count) as total_video_views
      FROM video_life_law
    `;

    // Đếm chat conversations
    const chatQuery = `
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations
      FROM conversations
    `;

    const [
      userResult,
      knowledgeResult,
      documentResult,
      newsResult,
      videoResult,
      chatResult,
    ] = await Promise.all([
      pool.query(userQuery),
      pool.query(knowledgeQuery),
      pool.query(documentQuery),
      pool.query(newsQuery),
      pool.query(videoQuery),
      pool.query(chatQuery),
    ]);

    res.json({
      success: true,
      data: {
        users: userResult.rows[0],
        legalKnowledge: knowledgeResult.rows[0],
        legalDocuments: documentResult.rows[0],
        legalNews: newsResult.rows[0],
        videos: videoResult.rows[0],
        chats: chatResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Error getting overall stats:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy thống kê tổng hợp",
    });
  }
};

module.exports = {
  getOverallStats,
};
