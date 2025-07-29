const { pool } = require("../config/database");

class LegalNews {
  // Get all legal news with pagination and filters
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "ts_create",
      sortOrder = "DESC",
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
      SELECT *
      FROM legal_news
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM legal_news
      ${whereClause}
    `;

    try {
      const [result, countResult] = await Promise.all([
        pool.query(query, [...queryParams, limit, offset]),
        pool.query(countQuery, queryParams),
      ]);

      return {
        news: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get news by ID
  static async getById(id) {
    const query = `
      SELECT *
      FROM legal_news
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create new news
  static async create(newsData) {
    const { title, content, description, images } = newsData;

    const query = `
      INSERT INTO legal_news (
        title, content, description, images
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [title, content, description, images || []];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update news
  static async update(id, updateData) {
    const { title, content, description, images } = updateData;

    const query = `
      UPDATE legal_news SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        description = COALESCE($3, description),
        images = COALESCE($4, images),
        ts_update = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const values = [title, content, description, images, id];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete news
  static async delete(id) {
    const query = `
      DELETE FROM legal_news
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Increment view count
  static async incrementViewCount(id) {
    const query = `
      UPDATE legal_news SET
        view_count = view_count + 1,
        ts_update = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING view_count
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get recent news
  static async getRecentNews(limit = 10) {
    const query = `
      SELECT *
      FROM legal_news
      ORDER BY ts_create DESC
      LIMIT $1
    `;

    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get popular news (by view count)
  static async getPopularNews(limit = 10) {
    const query = `
      SELECT *
      FROM legal_news
      ORDER BY view_count DESC, ts_create DESC
      LIMIT $1
    `;

    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LegalNews;
