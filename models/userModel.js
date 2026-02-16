/**
 * User Model
 * Handles all user-related database operations
 */

const { query } = require('../config/database');

class User {
    /**
     * Create a new user
     */
    static async create(userData) {
        const { name, email, password, designation, employee_id, mobile, department, role } = userData;
        
        const sql = `
            INSERT INTO users (name, email, password, designation, employee_id, mobile, department, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [name, email, password, designation, employee_id, mobile, department, role || 'submitter'];
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = $1';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = $1';
        const result = await query(sql, [email]);
        return result.rows[0];
    }

    /**
     * Find user by employee ID
     */
    static async findByEmployeeId(employee_id) {
        const sql = 'SELECT * FROM users WHERE employee_id = $1';
        const result = await query(sql, [employee_id]);
        return result.rows[0];
    }

    /**
     * Get all users
     */
    static async findAll(filters = {}) {
        let sql = 'SELECT id, name, email, designation, employee_id, mobile, department, role, created_at FROM users WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.role) {
            sql += ` AND role = $${paramCount}`;
            values.push(filters.role);
            paramCount++;
        }

        if (filters.department) {
            sql += ` AND department = $${paramCount}`;
            values.push(filters.department);
            paramCount++;
        }

        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    }

    /**
     * Update user
     */
    static async update(id, userData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        Object.keys(userData).forEach(key => {
            if (userData[key] !== undefined && key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = $${paramCount}`);
                values.push(userData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const sql = `
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Delete user
     */
    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Check if email exists
     */
    static async emailExists(email, excludeId = null) {
        let sql = 'SELECT id FROM users WHERE email = $1';
        const values = [email];

        if (excludeId) {
            sql += ' AND id != $2';
            values.push(excludeId);
        }

        const result = await query(sql, values);
        return result.rows.length > 0;
    }

    /**
     * Check if employee ID exists
     */
    static async employeeIdExists(employee_id, excludeId = null) {
        let sql = 'SELECT id FROM users WHERE employee_id = $1';
        const values = [employee_id];

        if (excludeId) {
            sql += ' AND id != $2';
            values.push(excludeId);
        }

        const result = await query(sql, values);
        return result.rows.length > 0;
    }

    /**
     * Get users by role
     */
    static async findByRole(role) {
        const sql = `
            SELECT id, name, email, designation, employee_id, mobile, department, role, created_at 
            FROM users 
            WHERE role = $1
            ORDER BY name
        `;
        const result = await query(sql, [role]);
        return result.rows;
    }

    /**
     * Get user statistics
     */
    static async getStatistics(userId) {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM trips t 
                 JOIN trip_users tu ON t.id = tu.trip_id 
                 WHERE tu.user_id = $1) as total_trips,
                (SELECT COUNT(*) FROM expenses WHERE user_id = $1) as total_expenses,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = $1) as total_expense_amount
        `;
        const result = await query(sql, [userId]);
        return result.rows[0];
    }
}

module.exports = User;
