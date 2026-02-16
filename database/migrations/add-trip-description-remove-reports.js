/**
 * Migration: Add description field to trips and remove reports table
 * Run this with: node database/migrations/add-trip-description-remove-reports.js
 */

const { pool } = require('../../config/database');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding description column to trips table...');
        await client.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS description TEXT
        `);

        console.log('Dropping reports table and related indexes...');
        await client.query('DROP TABLE IF EXISTS reports CASCADE');

        await client.query('COMMIT');
        console.log('✓ Migration complete: Trip description added, reports table removed');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
