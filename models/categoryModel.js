/**
 * Category Model
 * Handles all category-related database operations
 */

const { query } = require('../config/database');

class Category {
    /**
     * Create a new category
     */
    static async create(categoryData) {
        const { name, description } = categoryData;
        
        const sql = `
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        const values = [name, description || null];
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Find category by ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM categories WHERE id = $1';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Find category by name
     */
    static async findByName(name) {
        const sql = 'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)';
        const result = await query(sql, [name]);
        return result.rows[0];
    }

    /**
     * Get all categories
     */
    static async findAll() {
        const sql = 'SELECT * FROM categories ORDER BY name';
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Update category
     */
    static async update(id, categoryData) {
        const { name, description } = categoryData;
        
        const sql = `
            UPDATE categories 
            SET name = COALESCE($1, name),
                description = COALESCE($2, description)
            WHERE id = $3
            RETURNING *
        `;
        
        const values = [name, description, id];
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Delete category
     */
    static async delete(id) {
        // Check if category is in use
        const checkSql = 'SELECT COUNT(*) FROM expenses WHERE category_id = $1';
        const checkResult = await query(checkSql, [id]);
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            throw new Error('Cannot delete category that is in use by expenses');
        }

        const sql = 'DELETE FROM categories WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get category with expense count
     */
    static async findWithExpenseCount(id) {
        const sql = `
            SELECT c.*, COUNT(e.id) as expense_count, COALESCE(SUM(e.amount), 0) as total_amount
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id
            WHERE c.id = $1
            GROUP BY c.id
        `;
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get all categories with expense counts
     */
    static async findAllWithExpenseCounts() {
        const sql = `
            SELECT c.*, COUNT(e.id) as expense_count, COALESCE(SUM(e.amount), 0) as total_amount
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id
            GROUP BY c.id
            ORDER BY c.name
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Check if category name exists
     */
    static async nameExists(name, excludeId = null) {
        let sql = 'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)';
        const values = [name];

        if (excludeId) {
            sql += ' AND id != $2';
            values.push(excludeId);
        }

        const result = await query(sql, values);
        return result.rows.length > 0;
    }
}

module.exports = Category;