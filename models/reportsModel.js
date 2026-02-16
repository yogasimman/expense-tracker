/**
 * Report Model
 * Handles all report-related database operations
 */

const { query } = require('../config/database');

class Report {
    /**
     * Create a new report
     */
    static async create(reportData) {
        const { userId, tripId, reportName, businessPurpose, duration, status, rejectionReason, approvalMessage, reimbursementDate } = reportData;
        
        const sql = `
            INSERT INTO reports (user_id, trip_id, report_name, business_purpose, start_date, end_date, status, rejection_reason, approval_message, reimbursement_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const values = [
            userId,
            tripId,
            reportName,
            businessPurpose,
            duration.startDate,
            duration.endDate,
            status || 'submitted',
            rejectionReason || null,
            approvalMessage || null,
            reimbursementDate || null
        ];
        
        const result = await query(sql, values);
        return result.rows[0];
    }

    /**
     * Find report by ID
     */
    static async findById(id) {
        const sql = `
            SELECT r.*, 
                   u.name as user_name, 
                   u.employee_id, 
                   u.email as user_email,
                   t.trip_name, 
                   t.travel_type, 
                   t.status as trip_status
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN trips t ON r.trip_id = t.id
            WHERE r.id = $1
        `;
        const result = await query(sql, [id]);
        
        if (result.rows.length === 0) return null;
        
        const report = result.rows[0];
        
        // Add duration object for compatibility
        report.duration = {
            startDate: report.start_date,
            endDate: report.end_date
        };
        
        return report;
    }

    /**
     * Get all reports with optional filters
     */
    static async findAll(filters = {}) {
        let sql = `
            SELECT r.*, 
                   u.name as user_name, 
                   u.employee_id,
                   t.trip_name, 
                   t.travel_type,
                   (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = r.trip_id) as total_expenses,
                   (SELECT COALESCE(SUM(amount), 0) FROM advances WHERE trip_id = r.trip_id) as total_advances
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN trips t ON r.trip_id = t.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND r.user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.tripId) {
            sql += ` AND r.trip_id = $${paramCount}`;
            values.push(filters.tripId);
            paramCount++;
        }

        if (filters.status) {
            sql += ` AND r.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        sql += ' ORDER BY r.created_at DESC';

        const result = await query(sql, values);
        
        // Add duration object for compatibility
        return result.rows.map(report => ({
            ...report,
            duration: {
                startDate: report.start_date,
                endDate: report.end_date
            }
        }));
    }

    /**
     * Update report
     */
    static async update(id, reportData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Handle duration separately
        if (reportData.duration) {
            if (reportData.duration.startDate !== undefined) {
                fields.push(`start_date = $${paramCount}`);
                values.push(reportData.duration.startDate);
                paramCount++;
            }
            if (reportData.duration.endDate !== undefined) {
                fields.push(`end_date = $${paramCount}`);
                values.push(reportData.duration.endDate);
                paramCount++;
            }
        }

        const allowedFields = ['user_id', 'trip_id', 'report_name', 'business_purpose', 'status', 'rejection_reason', 'approval_message', 'reimbursement_date'];
        
        Object.keys(reportData).forEach(key => {
            if (reportData[key] !== undefined && allowedFields.includes(key)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(reportData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);
        const sql = `
            UPDATE reports 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(sql, values);
        const report = result.rows[0];
        
        if (report) {
            report.duration = {
                startDate: report.start_date,
                endDate: report.end_date
            };
        }
        
        return report;
    }

    /**
     * Delete report
     */
    static async delete(id) {
        const sql = 'DELETE FROM reports WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Get reports by user ID
     */
    static async findByUserId(userId) {
        return await this.findAll({ userId });
    }

    /**
     * Get reports by trip ID
     */
    static async findByTripId(tripId) {
        return await this.findAll({ tripId });
    }

    /**
     * Update report status
     */
    static async updateStatus(id, status, message = null) {
        const updateData = { status };
        
        if (status === 'approved') {
            updateData.approval_message = message;
            updateData.reimbursement_date = new Date();
        } else if (status === 'rejected') {
            updateData.rejection_reason = message;
        }
        
        return await this.update(id, updateData);
    }

    /**
     * Get report statistics
     */
    static async getStatistics(filters = {}) {
        let sql = `
            SELECT 
                COUNT(*) as total_count,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
            FROM reports
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
     * Get report with full details (expenses, advances)
     */
    static async findByIdWithDetails(id) {
        const report = await this.findById(id);
        
        if (!report) return null;
        
        // Get expenses for this trip
        const expensesSql = `
            SELECT e.*, c.name as category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.trip_id = $1
            ORDER BY e.date DESC
        `;
        const expensesResult = await query(expensesSql, [report.trip_id]);
        report.expenses = expensesResult.rows;
        
        // Get advances for this trip
        const advancesSql = `
            SELECT * FROM advances WHERE trip_id = $1 ORDER BY created_at DESC
        `;
        const advancesResult = await query(advancesSql, [report.trip_id]);
        report.advances = advancesResult.rows;
        
        // Calculate totals
        report.totalExpenses = report.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        report.totalAdvances = report.advances.reduce((sum, adv) => sum + parseFloat(adv.amount), 0);
        report.netAmount = report.totalExpenses - report.totalAdvances;
        
        return report;
    }

    /**
     * Get pending reports for approval
     */
    static async getPendingReports() {
        return await this.findAll({ status: 'submitted' });
    }
}

module.exports = Report;