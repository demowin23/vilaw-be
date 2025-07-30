const { pool } = require("../config/database");

// Lấy danh sách video pháp luật đời sống
const getVideoLifeLaw = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      is_featured,
      age_group,
      hashtag,
      sort_by = "ts_create",
      sort_order = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortFields = [
      "ts_create",
      "view_count",
      "like_count",
      "dislike_count",
      "title",
      "duration",
    ];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sort_by)) {
      return res
        .status(400)
        .json({ success: false, error: "Trường sắp xếp không hợp lệ" });
    }

    if (!validSortOrders.includes(sort_order)) {
      return res
        .status(400)
        .json({ success: false, error: "Thứ tự sắp xếp không hợp lệ" });
    }

    let query = `
      SELECT v.*, u.full_name as creator_name
      FROM video_life_law v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.is_active = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Thêm điều kiện lọc theo trạng thái approval
    const isPending = req.query.isPending;
    const isAdmin = req.user && req.user.role === "admin";
    const isLawyer = req.user && req.user.role === "lawyer";
    const isCollaborator = req.user && req.user.role === "collaborator";

    if (isPending === "true") {
      // Lấy trạng thái chờ duyệt (is_approved = false)
      query += ` AND v.is_approved = false`;
    } else if (isPending === "false") {
      // Lấy trạng thái đã duyệt (is_approved = true)
      query += ` AND v.is_approved = true`;
    } else if (isAdmin || isLawyer || isCollaborator) {
      // Admin, lawyer, collaborator mặc định có thể xem tất cả (cả đã duyệt và chờ duyệt)
      query += ` AND (v.is_approved = true OR v.is_approved = false)`;
    } else {
      // User thường chỉ xem đã duyệt
      query += ` AND v.is_approved = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    }

    if (type) {
      query += ` AND v.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (v.title ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (hashtag) {
      query += ` AND $${paramIndex} = ANY(v.hashtags)`;
      queryParams.push(hashtag);
      paramIndex++;
    }

    if (is_featured === "true") {
      query += ` AND v.is_featured = true`;
    }

    if (age_group) {
      query += ` AND v.age_group = $${paramIndex}`;
      queryParams.push(age_group);
      paramIndex++;
    }

    // Count total records với logic approval tương tự
    let countQuery = `SELECT COUNT(*) as count FROM video_life_law WHERE is_active = true`;
    const countParams = [];
    let countParamIndex = 1;

    // Thêm điều kiện lọc theo trạng thái approval cho count
    if (isPending === "true") {
      countQuery += ` AND is_approved = false`;
    } else if (isPending === "false") {
      countQuery += ` AND is_approved = true`;
    } else if (isAdmin || isLawyer || isCollaborator) {
      countQuery += ` AND (is_approved = true OR is_approved = false)`;
    } else {
      countQuery += ` AND is_approved = $${countParamIndex}`;
      countParams.push(true);
      countParamIndex++;
    }

    if (type) {
      countQuery += ` AND type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (hashtag) {
      countQuery += ` AND $${countParamIndex} = ANY(hashtags)`;
      countParams.push(hashtag);
      countParamIndex++;
    }

    if (is_featured === "true") {
      countQuery += ` AND is_featured = true`;
    }

    if (age_group) {
      countQuery += ` AND age_group = $${countParamIndex}`;
      countParams.push(age_group);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ` ORDER BY v.${sort_by} ${sort_order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get user's like/dislike status for each video if user is authenticated
    const videos = result.rows;
    if (req.user) {
      for (let video of videos) {
        const likeResult = await pool.query(
          "SELECT action_type FROM video_likes WHERE video_id = $1 AND user_id = $2",
          [video.id, req.user.id]
        );
        video.user_action =
          likeResult.rows.length > 0 ? likeResult.rows[0].action_type : null;
      }
    }

    res.json({
      success: true,
      data: videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting videos:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Lấy video theo ID
const getVideoLifeLawById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT v.*, u.full_name as creator_name
      FROM video_life_law v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.id = $1 AND v.is_active = true
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    const video = result.rows[0];

    // Get user's like/dislike status if authenticated
    if (req.user) {
      const likeResult = await pool.query(
        "SELECT action_type FROM video_likes WHERE video_id = $1 AND user_id = $2",
        [id, req.user.id]
      );
      video.user_action =
        likeResult.rows.length > 0 ? likeResult.rows[0].action_type : null;
    }

    // Tăng lượt xem
    await pool.query(
      `UPDATE video_life_law SET view_count = view_count + 1 WHERE id = $1`,
      [id]
    );

    res.json({ success: true, data: video });
  } catch (error) {
    console.error("Error getting video by ID:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Tạo video mới
const createVideoLifeLaw = async (req, res) => {
  try {
    let videoUrl = null;
    let thumbnailUrl = null;

    if (req.files) {
      if (req.files.video) {
        videoUrl = `/uploads/${req.files.video[0].filename}`;
      }
      if (req.files.thumbnail) {
        thumbnailUrl = `/uploads/${req.files.thumbnail[0].filename}`;
      }
    }

    const {
      type,
      title,
      description,
      duration = 0,
      age_group = "all",
      hashtags,
    } = req.body;

    if (!type || !title || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Loại video, tiêu đề và file video là bắt buộc",
      });
    }

    const validAgeGroups = ["all", "13+", "16+", "18+"];
    if (age_group && !validAgeGroups.includes(age_group)) {
      return res.status(400).json({
        success: false,
        error: "Độ tuổi không hợp lệ",
      });
    }

    // Parse hashtags from string to array
    let hashtagsArray = [];
    if (hashtags) {
      if (typeof hashtags === "string") {
        hashtagsArray = hashtags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(hashtags)) {
        hashtagsArray = hashtags.filter((tag) => tag && tag.trim().length > 0);
      }
    }

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = req.user.role === "admin" ? true : false;

    const query = `
      INSERT INTO video_life_law (type, title, video, description, thumbnail, duration, age_group, hashtags, created_by, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      type,
      title,
      videoUrl,
      description || null,
      thumbnailUrl || null,
      parseInt(duration) || 0,
      age_group,
      hashtagsArray.length > 0 ? hashtagsArray : null,
      req.user.id,
      isApproved,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Tạo video thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Cập nhật video
const updateVideoLifeLaw = async (req, res) => {
  try {
    const { id } = req.params;
    let videoUrl = null;
    let thumbnailUrl = null;

    if (req.files) {
      if (req.files.video) {
        videoUrl = `/uploads/${req.files.video[0].filename}`;
      }
      if (req.files.thumbnail) {
        thumbnailUrl = `/uploads/${req.files.thumbnail[0].filename}`;
      }
    }

    const {
      type,
      title,
      description,
      duration,
      age_group,
      is_featured,
      hashtags,
    } = req.body;

    // Kiểm tra video có tồn tại không
    const existingVideo = await pool.query(
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true",
      [id]
    );

    if (existingVideo.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    // Kiểm tra quyền (admin/lawyer có thể sửa tất cả, user chỉ sửa video của mình)
    if (req.user.role !== "admin" && req.user.role !== "lawyer") {
      if (existingVideo.rows[0].created_by !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, error: "Không có quyền sửa video này" });
      }
    }

    const validAgeGroups = ["all", "13+", "16+", "18+"];
    if (age_group && !validAgeGroups.includes(age_group)) {
      return res.status(400).json({
        success: false,
        error: "Độ tuổi không hợp lệ",
      });
    }

    // Parse hashtags from string to array
    let hashtagsArray = null;
    if (hashtags !== undefined) {
      if (typeof hashtags === "string") {
        hashtagsArray = hashtags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      } else if (Array.isArray(hashtags)) {
        hashtagsArray = hashtags.filter((tag) => tag && tag.trim().length > 0);
      }
      // If empty array, set to null
      if (hashtagsArray && hashtagsArray.length === 0) {
        hashtagsArray = null;
      }
    }

    let query = `
      UPDATE video_life_law SET
        type = COALESCE($1, type),
        title = COALESCE($2, title),
        video = COALESCE($3, video),
        description = COALESCE($4, description),
        thumbnail = COALESCE($5, thumbnail),
        duration = COALESCE($6, duration),
        age_group = COALESCE($7, age_group),
        hashtags = COALESCE($8, hashtags),
        is_featured = COALESCE($9, is_featured),
        ts_update = CURRENT_TIMESTAMP
      WHERE id = $10 AND is_active = true
      RETURNING *
    `;

    const values = [
      type || null,
      title || null,
      videoUrl || null,
      description || null,
      thumbnailUrl || null,
      duration ? parseInt(duration) : null,
      age_group || null,
      hashtagsArray,
      is_featured !== undefined ? is_featured === "true" : null,
      id,
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Cập nhật video thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Xóa video (soft delete)
const deleteVideoLifeLaw = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra video có tồn tại không
    const existingVideo = await pool.query(
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true",
      [id]
    );

    if (existingVideo.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    // Kiểm tra quyền (admin/lawyer có thể xóa tất cả, user chỉ xóa video của mình)
    if (req.user.role !== "admin" && req.user.role !== "lawyer") {
      if (existingVideo.rows[0].created_by !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, error: "Không có quyền xóa video này" });
      }
    }

    // Hard delete - xóa hoàn toàn khỏi database
    await pool.query("DELETE FROM video_life_law WHERE id = $1", [id]);

    res.json({ success: true, message: "Xóa video thành công" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Like/Dislike video
const toggleVideoLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' hoặc 'dislike'

    if (!action || !["like", "dislike"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Action phải là 'like' hoặc 'dislike'",
      });
    }

    // Kiểm tra video có tồn tại không
    const existingVideo = await pool.query(
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true",
      [id]
    );

    if (existingVideo.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    // Kiểm tra user đã like/dislike chưa
    const existingLike = await pool.query(
      "SELECT * FROM video_likes WHERE video_id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (existingLike.rows.length > 0) {
      const currentAction = existingLike.rows[0].action_type;

      if (currentAction === action) {
        // Nếu đã like/dislike rồi thì bỏ like/dislike
        await pool.query(
          "DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2",
          [id, req.user.id]
        );

        // Giảm count
        const updateField = action === "like" ? "like_count" : "dislike_count";
        await pool.query(
          `UPDATE video_life_law SET ${updateField} = ${updateField} - 1 WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: `Đã bỏ ${action === "like" ? "like" : "dislike"} video`,
          data: { action: null },
        });
      } else {
        // Nếu đổi từ like sang dislike hoặc ngược lại
        await pool.query(
          "UPDATE video_likes SET action_type = $1 WHERE video_id = $2 AND user_id = $3",
          [action, id, req.user.id]
        );

        // Cập nhật count
        const oldField =
          currentAction === "like" ? "like_count" : "dislike_count";
        const newField = action === "like" ? "like_count" : "dislike_count";

        await pool.query(
          `UPDATE video_life_law SET ${oldField} = ${oldField} - 1, ${newField} = ${newField} + 1 WHERE id = $1`,
          [id]
        );

        res.json({
          success: true,
          message: `Đã ${action} video`,
          data: { action },
        });
      }
    } else {
      // Chưa like/dislike thì thêm mới
      await pool.query(
        "INSERT INTO video_likes (video_id, user_id, action_type) VALUES ($1, $2, $3)",
        [id, req.user.id, action]
      );

      // Tăng count
      const updateField = action === "like" ? "like_count" : "dislike_count";
      await pool.query(
        `UPDATE video_life_law SET ${updateField} = ${updateField} + 1 WHERE id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: `Đã ${action} video`,
        data: { action },
      });
    }
  } catch (error) {
    console.error("Error toggling video like:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Lấy danh sách comment của video
const getVideoComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Kiểm tra video có tồn tại không
    const existingVideo = await pool.query(
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true",
      [id]
    );

    if (existingVideo.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    // Lấy comments (chỉ comment gốc, không lấy reply)
    const commentsQuery = `
      SELECT 
        c.*,
        u.full_name as user_name,
        u.avatar as user_avatar,
        u.role as user_role,
        (SELECT COUNT(*) FROM video_comments WHERE parent_id = c.id AND is_active = true) as reply_count
      FROM video_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.video_id = $1 AND c.parent_id IS NULL AND c.is_active = true
      ORDER BY c.ts_create DESC
      LIMIT $2 OFFSET $3
    `;

    const commentsResult = await pool.query(commentsQuery, [
      id,
      parseInt(limit),
      offset,
    ]);
    const comments = commentsResult.rows;

    // Lấy reply cho mỗi comment (tối đa 3 reply)
    for (let comment of comments) {
      const repliesQuery = `
        SELECT 
          r.*,
          u.full_name as user_name,
          u.avatar as user_avatar,
          u.role as user_role
        FROM video_comments r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.parent_id = $1 AND r.is_active = true
        ORDER BY r.ts_create ASC
        LIMIT 3
      `;

      const repliesResult = await pool.query(repliesQuery, [comment.id]);
      comment.replies = repliesResult.rows;

      // Kiểm tra user đã like comment chưa
      if (req.user) {
        const userLikeResult = await pool.query(
          "SELECT * FROM video_comment_likes WHERE comment_id = $1 AND user_id = $2",
          [comment.id, req.user.id]
        );
        comment.user_liked = userLikeResult.rows.length > 0;

        // Kiểm tra user đã like reply chưa
        for (let reply of comment.replies) {
          const replyLikeResult = await pool.query(
            "SELECT * FROM video_comment_likes WHERE comment_id = $1 AND user_id = $2",
            [reply.id, req.user.id]
          );
          reply.user_liked = replyLikeResult.rows.length > 0;
        }
      }
    }

    // Đếm tổng số comment
    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM video_comments WHERE video_id = $1 AND parent_id IS NULL AND is_active = true",
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting video comments:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Thêm comment cho video
const addVideoComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nội dung comment không được để trống",
      });
    }

    // Kiểm tra video có tồn tại không
    const existingVideo = await pool.query(
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true",
      [id]
    );

    if (existingVideo.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Video không tồn tại" });
    }

    // Nếu là reply comment, kiểm tra comment gốc có tồn tại không
    if (parent_id) {
      const parentComment = await pool.query(
        "SELECT * FROM video_comments WHERE id = $1 AND video_id = $2 AND is_active = true",
        [parent_id, id]
      );

      if (parentComment.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Comment gốc không tồn tại" });
      }
    }

    // Thêm comment
    const result = await pool.query(
      `INSERT INTO video_comments (video_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.id, content.trim(), parent_id || null]
    );

    const comment = result.rows[0];

    // Lấy thông tin user
    const userResult = await pool.query(
      "SELECT full_name, avatar, role FROM users WHERE id = $1",
      [req.user.id]
    );

    const commentWithUser = {
      ...comment,
      user_name: userResult.rows[0].full_name,
      user_avatar: userResult.rows[0].avatar,
      user_role: userResult.rows[0].role,
      user_liked: false,
      replies: [],
    };

    res.status(201).json({
      success: true,
      message: "Thêm comment thành công",
      data: commentWithUser,
    });
  } catch (error) {
    console.error("Error adding video comment:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Like/Unlike comment
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Kiểm tra comment có tồn tại không
    const existingComment = await pool.query(
      "SELECT * FROM video_comments WHERE id = $1 AND is_active = true",
      [commentId]
    );

    if (existingComment.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Comment không tồn tại" });
    }

    // Kiểm tra user đã like comment chưa
    const existingLike = await pool.query(
      "SELECT * FROM video_comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, req.user.id]
    );

    if (existingLike.rows.length > 0) {
      // Bỏ like
      await pool.query(
        "DELETE FROM video_comment_likes WHERE comment_id = $1 AND user_id = $2",
        [commentId, req.user.id]
      );

      // Giảm like count
      await pool.query(
        "UPDATE video_comments SET like_count = like_count - 1 WHERE id = $1",
        [commentId]
      );

      res.json({
        success: true,
        message: "Đã bỏ like comment",
        data: { liked: false },
      });
    } else {
      // Thêm like
      await pool.query(
        "INSERT INTO video_comment_likes (comment_id, user_id) VALUES ($1, $2)",
        [commentId, req.user.id]
      );

      // Tăng like count
      await pool.query(
        "UPDATE video_comments SET like_count = like_count + 1 WHERE id = $1",
        [commentId]
      );

      res.json({
        success: true,
        message: "Đã like comment",
        data: { liked: true },
      });
    }
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Xóa comment
const deleteVideoComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Kiểm tra comment có tồn tại không
    const existingComment = await pool.query(
      "SELECT * FROM video_comments WHERE id = $1 AND is_active = true",
      [commentId]
    );

    if (existingComment.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Comment không tồn tại" });
    }

    const comment = existingComment.rows[0];

    // Kiểm tra quyền (admin/lawyer có thể xóa tất cả, user chỉ xóa comment của mình)
    if (req.user.role !== "admin" && req.user.role !== "lawyer") {
      if (comment.user_id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, error: "Không có quyền xóa comment này" });
      }
    }

    // Soft delete comment và tất cả reply
    await pool.query(
      "UPDATE video_comments SET is_active = false WHERE id = $1 OR parent_id = $1",
      [commentId]
    );

    res.json({
      success: true,
      message: "Xóa comment thành công",
    });
  } catch (error) {
    console.error("Error deleting video comment:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Lấy danh sách loại video
const getVideoTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT type
      FROM video_life_law
      WHERE is_active = true
      ORDER BY type
    `);

    const types = result.rows.map((row) => row.type);

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error getting video types:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Lấy danh sách độ tuổi
const getAgeGroups = async (req, res) => {
  try {
    const ageGroups = ["all", "13+", "16+", "18+"];

    res.json({
      success: true,
      data: ageGroups,
    });
  } catch (error) {
    console.error("Error getting age groups:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Lấy danh sách hashtags phổ biến
const getPopularHashtags = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        unnest(hashtags) as hashtag,
        COUNT(*) as count
      FROM video_life_law 
      WHERE hashtags IS NOT NULL AND is_active = true
      GROUP BY hashtag
      ORDER BY count DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error getting popular hashtags:", error);
    res.status(500).json({ success: false, error: "Lỗi server" });
  }
};

// Duyệt/từ chối video (Admin only)
const approveVideoLifeLaw = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt video",
      });
    }

    // Kiểm tra video tồn tại
    const checkQuery =
      "SELECT * FROM video_life_law WHERE id = $1 AND is_active = true";
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy video",
      });
    }

    // Cập nhật trạng thái approval
    const updateQuery = `
      UPDATE video_life_law 
      SET is_approved = $1, ts_update = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [is_approved, id]);

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt video thành công"
        : "Từ chối video thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error approving video:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt video",
    });
  }
};

// Lấy danh sách video chờ duyệt (Admin only)
const getPendingVideoLifeLaw = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      is_featured,
      age_group,
      hashtag,
      sort_by = "ts_create",
      sort_order = "desc",
    } = req.query;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem danh sách video chờ duyệt",
      });
    }

    const offset = (page - 1) * limit;
    const validSortFields = [
      "ts_create",
      "view_count",
      "like_count",
      "dislike_count",
      "title",
      "duration",
    ];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sort_by)) {
      return res
        .status(400)
        .json({ success: false, error: "Trường sắp xếp không hợp lệ" });
    }

    if (!validSortOrders.includes(sort_order)) {
      return res
        .status(400)
        .json({ success: false, error: "Thứ tự sắp xếp không hợp lệ" });
    }

    let query = `
      SELECT v.*, u.full_name as creator_name
      FROM video_life_law v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.is_active = true AND v.is_approved = false
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND v.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (v.title ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (hashtag) {
      query += ` AND $${paramIndex} = ANY(v.hashtags)`;
      queryParams.push(hashtag);
      paramIndex++;
    }

    if (is_featured === "true") {
      query += ` AND v.is_featured = true`;
    }

    if (age_group) {
      query += ` AND v.age_group = $${paramIndex}`;
      queryParams.push(age_group);
      paramIndex++;
    }

    // Count total records
    let countQuery = `SELECT COUNT(*) as count FROM video_life_law WHERE is_active = true AND is_approved = false`;
    const countParams = [];

    if (type) {
      countQuery += ` AND type = $1`;
      countParams.push(type);
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${
        countParams.length + 1
      } OR description ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    if (hashtag) {
      countQuery += ` AND $${countParams.length + 1} = ANY(hashtags)`;
      countParams.push(hashtag);
    }

    if (is_featured === "true") {
      countQuery += ` AND is_featured = true`;
    }

    if (age_group) {
      countQuery += ` AND age_group = $${countParams.length + 1}`;
      countParams.push(age_group);
    }

    const [result, countResult] = await Promise.all([
      pool.query(
        `${query} ORDER BY v.${sort_by} ${sort_order.toUpperCase()} LIMIT $${paramIndex} OFFSET $${
          paramIndex + 1
        }`,
        [...queryParams, limit, offset]
      ),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error("Error getting pending videos:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách video chờ duyệt",
    });
  }
};

// Lấy video xem nhiều nhất
const getMostViewedVideos = async (req, res) => {
  try {
    const { limit = 10, type, age_group, hashtag, is_featured } = req.query;

    let query = `
      SELECT v.*, u.full_name as creator_name
      FROM video_life_law v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.is_active = true AND v.is_approved = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND v.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (age_group) {
      query += ` AND v.age_group = $${paramIndex}`;
      queryParams.push(age_group);
      paramIndex++;
    }

    if (hashtag) {
      query += ` AND $${paramIndex} = ANY(v.hashtags)`;
      queryParams.push(hashtag);
      paramIndex++;
    }

    if (is_featured === "true") {
      query += ` AND v.is_featured = true`;
    }

    // Sắp xếp theo view_count giảm dần (xem nhiều nhất trước)
    query += ` ORDER BY v.view_count DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      message: "Lấy video xem nhiều nhất thành công",
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error getting most viewed videos:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy video xem nhiều nhất",
    });
  }
};

// Lấy video thích nhiều nhất
const getMostLikedVideos = async (req, res) => {
  try {
    const { limit = 10, type, age_group, hashtag, is_featured } = req.query;

    let query = `
      SELECT v.*, u.full_name as creator_name
      FROM video_life_law v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.is_active = true AND v.is_approved = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND v.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (age_group) {
      query += ` AND v.age_group = $${paramIndex}`;
      queryParams.push(age_group);
      paramIndex++;
    }

    if (hashtag) {
      query += ` AND $${paramIndex} = ANY(v.hashtags)`;
      queryParams.push(hashtag);
      paramIndex++;
    }

    if (is_featured === "true") {
      query += ` AND v.is_featured = true`;
    }

    // Sắp xếp theo like_count giảm dần (thích nhiều nhất trước)
    query += ` ORDER BY v.like_count DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      message: "Lấy video thích nhiều nhất thành công",
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error getting most liked videos:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy video thích nhiều nhất",
    });
  }
};

module.exports = {
  getVideoLifeLaw,
  getVideoLifeLawById,
  createVideoLifeLaw,
  updateVideoLifeLaw,
  deleteVideoLifeLaw,
  toggleVideoLike,
  getVideoComments,
  addVideoComment,
  toggleCommentLike,
  deleteVideoComment,
  getVideoTypes,
  getAgeGroups,
  getPopularHashtags,
  approveVideoLifeLaw,
  getPendingVideoLifeLaw,
  getMostViewedVideos,
  getMostLikedVideos,
};
