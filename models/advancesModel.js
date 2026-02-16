/**
 * Advance Model
 * Handles all advance payment-related database operations
 */

const { query } = require('../config/database');

class Advance {
    /**
     * Create a new advance
     */
    static async create(advanceData) {
        const { userId, tripId, amount, currency, paidThrough, referenceId, notes } = advanceData;
        
        const sql = `
            INSERT INTO advances (user_id, trip_id, amount, currency, paid_through, reference_id, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [userId, tripId, amount, currency, paidThrough, referenceId || null, notes || null];
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Find advance by ID
     */
    static async findById(id) {
        const sql = `
            SELECT a.*, u.name as user_name, t.trip_name
            FROM advances a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN trips t ON a.trip_id = t.id
            WHERE a.id = $1
        `;
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get all advances with optional filters
     */
    static async findAll(filters = {}) {
        let sql = `
            SELECT a.*, u.name as user_name, u.employee_id, t.trip_name, t.status as trip_status
            FROM advances a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN trips t ON a.trip_id = t.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND a.user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.tripId) {
            sql += ` AND a.trip_id = $${paramCount}`;
            values.push(filters.tripId);
            paramCount++;
        }

        if (filters.currency) {
            sql += ` AND a.currency = $${paramCount}`;
            values.push(filters.currency);
            paramCount++;
        }

        if (filters.paidThrough) {
            sql += ` AND a.paid_through = $${paramCount}`;
            values.push(filters.paidThrough);
            paramCount++;
        }

        if (filters.status) {
            sql += ` AND a.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        sql += ' ORDER BY a.created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    }

    /**
     * Update advance
     */
    static async update(id, advanceData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['user_id', 'trip_id', 'amount', 'currency', 'paid_through', 'reference_id', 'notes'];
        
        Object.keys(advanceData).forEach(key => {
            if (advanceData[key] !== undefined && allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(advanceData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const sql = `
            UPDATE advances 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Delete advance
     */
    static async delete(id) {
        const sql = 'DELETE FROM advances WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get advances by user ID
     */
    static async findByUserId(userId) {
        return await this.findAll({ userId });
    }

    /**
     * Get advances by trip ID
     */
    static async findByTripId(tripId) {
        return await this.findAll({ tripId });
    }

    /**
     * Get advance statistics
     */
    static async getStatistics(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(AVG(amount), 0) as average_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount
            FROM advances
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.tripId) {
            sql += ` AND trip_id = $${paramCount}`;
            values.push(filters.tripId);
            paramCount++;
        }

        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Get total advances for a trip
     */
    static async getTotalByTripId(tripId) {
        const sql = `
            SELECT 
                currency,
                COALESCE(SUM(amount), 0) as total_amount
            FROM advances
            WHERE trip_id = $1
            GROUP BY currency
        `;
        const result = await query(sql, [tripId]);
        return result.rows;
    }

    /**
     * Get total advances for a user
     */
    static async getTotalByUserId(userId) {
        const sql = `
            SELECT 
                currency,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(*) as advance_count
            FROM advances
            WHERE user_id = $1
            GROUP BY currency
        `;
        const result = await query(sql, [userId]);
        return result.rows;
    }

    /**
     * Approve advance
     */
    static async approve(id, approvedBy) {
        const sql = `
            UPDATE advances 
            SET status = 'approved', 
                approved_by = $1, 
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE id = $2
            RETURNING *
        `;
        const result = await query(sql, [approvedBy, id]);
        return result.rows[0];
    }

    /**
     * Reject advance with reason
     */
    static async reject(id, approvedBy, rejectionReason) {
        const sql = `
            UPDATE advances 
            SET status = 'rejected', 
                approved_by = $1, 
                approved_at = NOW(),
                rejection_reason = $2
            WHERE id = $3
            RETURNING *
        `;
        const result = await query(sql, [approvedBy, rejectionReason, id]);
        return result.rows[0];
    }

    /**
     * Approve multiple advances
     */
    static async approveMultiple(advanceIds, approvedBy) {
        const sql = `
            UPDATE advances 
            SET status = 'approved', 
                approved_by = $1, 
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE id = ANY($2::int[])
            RETURNING *
        `;
        const result = await query(sql, [approvedBy, advanceIds]);
        return result.rows;
    }

    /**
     * Get pending advances for a trip
     */
    static async findPendingByTripId(tripId) {
        return await this.findAll({ tripId, status: 'pending' });
    }
}

module.exports = Advance;