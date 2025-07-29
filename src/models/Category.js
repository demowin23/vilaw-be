const { pool } = require("../config/database");

const Category = {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM category WHERE is_active = true ORDER BY ts_create DESC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT * FROM category WHERE id = $1 AND is_active = true",
      [id]
    );
    return result.rows[0];
  },

  async create({ value, label, description }) {
    const result = await pool.query(
      `INSERT INTO category (value, label, description) VALUES ($1, $2, $3) RETURNING *`,
      [value, label, description]
    );
    return result.rows[0];
  },

  async update(id, { value, label, description }) {
    const result = await pool.query(
      `UPDATE category SET value = $1, label = $2, description = $3, ts_update = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [value, label, description, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    // Soft delete
    const result = await pool.query(
      `UPDATE category SET is_active = false, ts_update = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = Category;
