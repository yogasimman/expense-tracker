/**
 * Test Setup - shared helpers for all tests
 * Uses the REAL database (expense_tracker) with transaction rollback
 */
require('dotenv').config();
const { pool, query, transaction, getClient } = require('../config/database');

// Suppress console.log during tests (keep console.error for debugging)
const originalLog = console.log;
beforeAll(() => {
    console.log = () => {};
});
afterAll(() => {
    console.log = originalLog;
});

/**
 * Clean test data from database (only test records)
 */
async function cleanTestData() {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        // Delete in order respecting foreign keys
        await client.query("DELETE FROM receipts WHERE expense_id IN (SELECT id FROM expenses WHERE expense_title LIKE 'TEST_%')");
        await client.query("DELETE FROM expenses WHERE expense_title LIKE 'TEST_%'");
        await client.query("DELETE FROM advances WHERE notes LIKE 'TEST_%'");
        await client.query("DELETE FROM reports WHERE report_name LIKE 'TEST_%'");
        await client.query("DELETE FROM flights WHERE trip_id IN (SELECT id FROM trips WHERE trip_name LIKE 'TEST_%')");
        await client.query("DELETE FROM buses WHERE trip_id IN (SELECT id FROM trips WHERE trip_name LIKE 'TEST_%')");
        await client.query("DELETE FROM trains WHERE trip_id IN (SELECT id FROM trips WHERE trip_name LIKE 'TEST_%')");
        await client.query("DELETE FROM cabs WHERE trip_id IN (SELECT id FROM trips WHERE trip_name LIKE 'TEST_%')");
        await client.query("DELETE FROM trip_users WHERE trip_id IN (SELECT id FROM trips WHERE trip_name LIKE 'TEST_%')");
        await client.query("DELETE FROM trips WHERE trip_name LIKE 'TEST_%'");
        await client.query("DELETE FROM users WHERE email LIKE 'test_%@test.com'");
        await client.query("DELETE FROM categories WHERE name LIKE 'TEST_%'");
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Create a test user and return it
 */
async function createTestUser(overrides = {}) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const suffix = Date.now() + Math.random().toString(36).slice(2, 6);
    
    const defaults = {
        name: `Test User ${suffix}`,
        email: `test_${suffix}@test.com`,
        password: hashedPassword,
        designation: 'Tester',
        employee_id: `TEST_${suffix}`,
        mobile: '1234567890',
        department: 'Testing',
        role: 'submitter'
    };
    
    const data = { ...defaults, ...overrides };
    // Ensure email always starts with test_ for cleanup
    if (!data.email.startsWith('test_')) {
        data.email = `test_${data.email}`;
    }
    
    const result = await query(
        `INSERT INTO users (name, email, password, designation, employee_id, mobile, department, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [data.name, data.email, data.password, data.designation, data.employee_id, data.mobile, data.department, data.role]
    );
    return result.rows[0];
}

/**
 * Create a test trip with a user and return it
 */
async function createTestTrip(userId, overrides = {}) {
    const Trip = require('../models/tripModel');
    const defaults = {
        tripName: `TEST_Trip_${Date.now()}`,
        travelType: 'domestic',
        status: 'pending',
        userId: [userId],
        itinerary: { flights: [], buses: [], trains: [], cabs: [] }
    };
    return await Trip.create({ ...defaults, ...overrides });
}

/**
 * Create a test category
 */
async function createTestCategory(overrides = {}) {
    const suffix = Date.now() + Math.random().toString(36).slice(2, 6);
    const defaults = {
        name: `TEST_Cat_${suffix}`,
        description: 'Test category'
    };
    const data = { ...defaults, ...overrides };
    const result = await query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        [data.name, data.description]
    );
    return result.rows[0];
}

/**
 * Close database pool
 */
async function closePool() {
    await pool.end();
}

module.exports = {
    pool,
    query,
    transaction,
    getClient,
    cleanTestData,
    createTestUser,
    createTestTrip,
    createTestCategory,
    closePool
};
