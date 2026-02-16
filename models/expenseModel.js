/**
 * Expense Model
 * Handles all expense-related database operations including receipts
 */

const { query, transaction } = require('../config/database');

class Expense {
    /**
     * Create a new expense with receipts
     */
    static async create(expenseData) {
        return await transaction(async (client) => {
            const { userId, tripId, categoryId, expenseTitle, amount, currency, description, date, receipts } = expenseData;
            
            // Insert expense
            const expenseSql = `
                INSERT INTO expenses (user_id, trip_id, category_id, expense_title, amount, currency, description, date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const expenseValues = [
                userId, 
                tripId, 
                categoryId, 
                expenseTitle, 
                amount, 
                currency, 
                description || null,
                date || new Date()
            ];
            const expenseResult = await client.query(expenseSql, expenseValues);
            const expense = expenseResult.rows[0];
            
            // Add receipts if provided
            if (receipts && receipts.length > 0) {
                expense.receipts = [];
                for (const receipt of receipts) {
                    const receiptSql = `
                        INSERT INTO receipts (expense_id, filename, original_filename, content_type, file_size, file_data)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id, filename, original_filename, content_type, file_size, created_at
                    `;
                    const receiptResult = await client.query(receiptSql, [
                        expense.id,
                        receipt.filename,
                        receipt.original_filename,
                        receipt.content_type,
                        receipt.file_size,
                        receipt.file_data
                    ]);
                    expense.receipts.push(receiptResult.rows[0]);
                }
            }
            
            return expense;
        });
    }

    /**
     * Find expense by ID with receipts
     */
    static async findById(id) {
        const expenseSql = 'SELECT * FROM expenses WHERE id = $1';
        const expenseResult = await query(expenseSql, [id]);
        
        if (expenseResult.rows.length === 0) return null;
        
        const expense = expenseResult.rows[0];
        
        // Get receipts (without file data for performance)
        const receiptsSql = `
            SELECT id, filename, original_filename, content_type, file_size, created_at 
            FROM receipts 
            WHERE expense_id = $1
        `;
        const receiptsResult = await query(receiptsSql, [id]);
        expense.receipts = receiptsResult.rows;
        
        return expense;
    }

    /**
     * Find expense by ID with full receipt data
     */
    static async findByIdWithFullReceipts(id) {
        const expenseSql = 'SELECT * FROM expenses WHERE id = $1';
        const expenseResult = await query(expenseSql, [id]);
        
        if (expenseResult.rows.length === 0) return null;
        
        const expense = expenseResult.rows[0];
        
        // Get receipts with file data
        const receiptsSql = 'SELECT * FROM receipts WHERE expense_id = $1';
        const receiptsResult = await query(receiptsSql, [id]);
        expense.receipts = receiptsResult.rows;
        
        return expense;
    }

    /**
     * Get all expenses with optional filters
     */
    static async findAll(filters = {}) {
        let sql = `
            SELECT e.*, u.name as user_name, c.name as category_name, t.trip_name,
                   (SELECT COUNT(*) FROM receipts WHERE expense_id = e.id) as receipt_count
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN trips t ON e.trip_id = t.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND e.user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.tripId) {
            sql += ` AND e.trip_id = $${paramCount}`;
            values.push(filters.tripId);
            paramCount++;
        }

        if (filters.categoryId) {
            sql += ` AND e.category_id = $${paramCount}`;
            values.push(filters.categoryId);
            paramCount++;
        }

        if (filters.currency) {
            sql += ` AND e.currency = $${paramCount}`;
            values.push(filters.currency);
            paramCount++;
        }

        if (filters.startDate) {
            sql += ` AND e.date >= $${paramCount}`;
            values.push(filters.startDate);
            paramCount++;
        }

        if (filters.endDate) {
            sql += ` AND e.date <= $${paramCount}`;
            values.push(filters.endDate);
            paramCount++;
        }

        if (filters.status) {
            sql += ` AND e.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        sql += ' ORDER BY e.date DESC, e.created_at DESC';

        const result = await query(sql, values);
        return result.rows;
    }

    /**
     * Update expense
     */
    static async update(id, expenseData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['user_id', 'trip_id', 'category_id', 'expense_title', 'amount', 'currency', 'description', 'date'];
        
        Object.keys(expenseData).forEach(key => {
            if (expenseData[key] !== undefined && allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(expenseData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const sql = `
            UPDATE expenses 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Delete expense (cascades to receipts)
     */
    static async delete(id) {
        const sql = 'DELETE FROM expenses WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get expenses by user ID
     */
    static async findByUserId(userId) {
        return await this.findAll({ userId });
    }

    /**
     * Get expenses by trip ID
     */
    static async findByTripId(tripId) {
        return await this.findAll({ tripId });
    }

    /**
     * Get expenses by category ID
     */
    static async findByCategoryId(categoryId) {
        return await this.findAll({ categoryId });
    }

    /**
     * Add receipt to expense
     */
    static async addReceipt(expenseId, receiptData) {
        const sql = `
            INSERT INTO receipts (expense_id, filename, original_filename, content_type, file_size, file_data)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, filename, original_filename, content_type, file_size, created_at
        `;
        const result = await query(sql, [
            expenseId,
            receiptData.filename,
            receiptData.original_filename,
            receiptData.content_type,
            receiptData.file_size,
            receiptData.file_data
        ]);
        return result.rows[0];
    }

    /**
     * Get receipt by ID
     */
    static async getReceiptById(receiptId) {
        const sql = 'SELECT * FROM receipts WHERE id = $1';
        const result = await query(sql, [receiptId]);
        return result.rows[0];
    }

    /**
     * Delete receipt
     */
    static async deleteReceipt(receiptId) {
        const sql = 'DELETE FROM receipts WHERE id = $1 RETURNING *';
        const result = await query(sql, [receiptId]);
        return result.rows[0];
    }

    /**
     * Get expense statistics
     */
    static async getStatistics(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(AVG(amount), 0) as average_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount
            FROM expenses
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

        if (filters.categoryId) {
            sql += ` AND category_id = $${paramCount}`;
            values.push(filters.categoryId);
            paramCount++;
        }

        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Get expense summary by category
     */
    static async getSummaryByCategory(filters = {}) {
        let sql = `
            SELECT 
                c.id,
                c.name as category_name,
                COUNT(e.id) as expense_count,
                COALESCE(SUM(e.amount), 0) as total_amount
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND e.user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.tripId) {
            sql += ` AND e.trip_id = $${paramCount}`;
            values.push(filters.tripId);
            paramCount++;
        }

        sql += ' GROUP BY c.id, c.name ORDER BY total_amount DESC';

        const result = await query(sql, values);
        return result.rows;
    }

    /**
     * Approve expense
     */
    static async approve(id, approvedBy) {
        const sql = `
            UPDATE expenses 
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
     * Reject expense with reason
     */
    static async reject(id, approvedBy, rejectionReason) {
        const sql = `
            UPDATE expenses 
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
     * Approve multiple expenses
     */
    static async approveMultiple(expenseIds, approvedBy) {
        const sql = `
            UPDATE expenses 
            SET status = 'approved', 
                approved_by = $1, 
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE id = ANY($2::int[])
            RETURNING *
        `;
        const result = await query(sql, [approvedBy, expenseIds]);
        return result.rows;
    }

    /**
     * Get pending expenses for a trip
     */
    static async findPendingByTripId(tripId) {
        return await this.findAll({ tripId, status: 'pending' });
    }
}

module.exports = Expense;
