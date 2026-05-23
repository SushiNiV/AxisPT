const db = require('../config/db');

class AcademicYearModel {
  static async getAll() {
    const result = await db.query(`
      SELECT 
        year_id,
        year_label,
        is_active,
        current_sem,
        created_at,
        updated_at
      FROM academic_year
      ORDER BY year_label DESC
    `);
    return result.rows;
  }

  static async create(yearData) {
    const { year_label, is_active, current_sem } = yearData;
    
    if (is_active) {
      await db.query(`UPDATE academic_year SET is_active = false`);
    }
    
    const result = await db.query(`
      INSERT INTO academic_year (year_label, is_active, current_sem)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [year_label, is_active, current_sem || null]);
    
    return result.rows[0];
  }

  static async update(yearId, yearData) {
    const { year_label, is_active, current_sem } = yearData;
    
    if (is_active) {
      await db.query(`UPDATE academic_year SET is_active = false WHERE year_id != $1`, [yearId]);
    }
    
    const result = await db.query(`
      UPDATE academic_year 
      SET year_label = $1,
          is_active = $2,
          current_sem = $3,
          updated_at = NOW()
      WHERE year_id = $4
      RETURNING *
    `, [year_label, is_active, current_sem || null, yearId]);
    
    return result.rows[0];
  }

  static async delete(yearId) {
    const result = await db.query(`
      DELETE FROM academic_year WHERE year_id = $1
    `, [yearId]);
    return result.rowCount > 0;
  }

  static async findById(yearId) {
    const result = await db.query(`
      SELECT 
        year_id,
        year_label,
        is_active,
        current_sem,
        created_at,
        updated_at
      FROM academic_year
      WHERE year_id = $1
    `, [yearId]);
    return result.rows[0];
  }

  static async getActive() {
    const result = await db.query(`
      SELECT 
        year_id,
        year_label,
        is_active,
        current_sem,
        created_at,
        updated_at
      FROM academic_year
      WHERE is_active = true
      LIMIT 1
    `);
    return result.rows[0];
  }

  static async setActive(yearId) {
    await db.query(`UPDATE academic_year SET is_active = false`);
    const result = await db.query(`
      UPDATE academic_year 
      SET is_active = true, updated_at = NOW()
      WHERE year_id = $1
      RETURNING *
    `, [yearId]);
    return result.rows[0];
  }

  static async updateSemester(yearId, currentSem) {
    const result = await db.query(`
      UPDATE academic_year 
      SET current_sem = $1, updated_at = NOW()
      WHERE year_id = $2
      RETURNING *
    `, [currentSem, yearId]);
    return result.rows[0];
  }
}

module.exports = AcademicYearModel;