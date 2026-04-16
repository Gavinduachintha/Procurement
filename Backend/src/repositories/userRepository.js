import { query } from "../config/db.js";

export const userRepository = {
  async create({ fullName, email, passwordHash, role, department }) {
    const { rows } = await query(
      `INSERT INTO users (full_name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, department, created_at`,
      [fullName, email.toLowerCase(), passwordHash, role, department || null],
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      "SELECT id, full_name, email, role, department, created_at FROM users WHERE id = $1",
      [id],
    );
    return rows[0] || null;
  },

  async findByRole(role) {
    const { rows } = await query(
      "SELECT id, full_name, email, role, department FROM users WHERE role = $1 ORDER BY id ASC",
      [role],
    );
    return rows;
  },

  async findByRoleAndDepartment(role, department) {
    const { rows } = await query(
      `SELECT id, full_name, email, role, department
       FROM users
       WHERE role = $1
         AND UPPER(REPLACE(REPLACE(COALESCE(department, ''), ' ', '_'), '-', '_')) = $2
       ORDER BY id ASC`,
      [role, department],
    );
    return rows;
  },
};
