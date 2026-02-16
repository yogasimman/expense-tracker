/**
 * Analytics Helper
 * Contains functions for aggregating analytics data from PostgreSQL
 */

const { query } = require('../config/database');

class AnalyticsHelper {
    /**
     * Get user expense analytics by category
     */
    static async getUserExpensesByCategory(userId) {
        const sql = `
            SELECT c.id, c.name, COALESCE(SUM(e.amount), 0) as total_amount
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(e.amount), 0) > 0
            ORDER BY c.id
        `;
        const result = await query(sql, [userId]);
        return result.rows;
    }

    /**
     * Get overall expense analytics by category
     */
    static async getOverallExpensesByCategory() {
        const sql = `
            SELECT c.id, c.name, COALESCE(SUM(e.amount), 0) as total_amount
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(e.amount), 0) > 0
            ORDER BY c.id
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Get user trip counts by travel type
     */
    static async getUserTripsByType(userId) {
        const sql = `
            SELECT t.travel_type, COUNT(*) as count
            FROM trips t
            INNER JOIN trip_users tu ON t.id = tu.trip_id
            WHERE tu.user_id = $1
            GROUP BY t.travel_type
        `;
        const result = await query(sql, [userId]);
        
        // Convert to object with default values
        const tripCounts = { local: 0, domestic: 0, international: 0 };
        result.rows.forEach(row => {
            tripCounts[row.travel_type] = parseInt(row.count);
        });
        
        return tripCounts;
    }

    /**
     * Get overall trip counts by travel type
     */
    static async getOverallTripsByType() {
        const sql = `
            SELECT travel_type, COUNT(*) as count
            FROM trips
            GROUP BY travel_type
        `;
        const result = await query(sql);
        
        // Convert to object with default values
        const tripCounts = { local: 0, domestic: 0, international: 0 };
        result.rows.forEach(row => {
            tripCounts[row.travel_type] = parseInt(row.count);
        });
        
        return tripCounts;
    }

    /**
     * Get user advance totals by currency
     */
    static async getUserAdvancesByCurrency(userId) {
        const sql = `
            SELECT currency, COALESCE(SUM(amount), 0) as total_amount
            FROM advances
            WHERE user_id = $1
            GROUP BY currency
        `;
        const result = await query(sql, [userId]);
        return result.rows;
    }

    /**
     * Get overall advance totals by currency
     */
    static async getOverallAdvancesByCurrency() {
        const sql = `
            SELECT currency, COALESCE(SUM(amount), 0) as total_amount
            FROM advances
            GROUP BY currency
        `;
        const result = await query(sql);
        return result.rows;
    }

    /**
     * Get user report counts by status
     */
    static async getUserReportsByStatus(userId) {
        const sql = `
            SELECT status, COUNT(*) as count
            FROM reports
            WHERE user_id = $1
            GROUP BY status
        `;
        const result = await query(sql, [userId]);
        
        // Convert to object with default values
        const reportStatuses = { submitted: 0, approved: 0, rejected: 0 };
        result.rows.forEach(row => {
            reportStatuses[row.status] = parseInt(row.count);
        });
        
        return reportStatuses;
    }

    /**
     * Get overall report counts by status
     */
    static async getOverallReportsByStatus() {
        const sql = `
            SELECT status, COUNT(*) as count
            FROM reports
            GROUP BY status
        `;
        const result = await query(sql);
        
        // Convert to object with default values
        const reportStatuses = { submitted: 0, approved: 0, rejected: 0 };
        result.rows.forEach(row => {
            reportStatuses[row.status] = parseInt(row.count);
        });
        
        return reportStatuses;
    }
}

module.exports = AnalyticsHelper;
