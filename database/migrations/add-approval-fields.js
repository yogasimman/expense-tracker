/**
 * Migration: Add approval workflow fields to expenses and advances
 * Adds status and rejection_reason fields
 */

require('dotenv').config();
const { Client } = require('pg');

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'expense_tracker'
};

async function migrate() {
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to database');

        // Add status and rejection_reason to expenses table
        console.log('Adding approval fields to expenses table...');
        await client.query(`
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
            ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
        `);

        // Add status and rejection_reason to advances table
        console.log('Adding approval fields to advances table...');
        await client.query(`
            ALTER TABLE advances 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
            ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
        `);

        // Update trip status constraint to include 'finished'
        console.log('Updating trip status constraint...');
        await client.query(`
            ALTER TABLE trips 
            DROP CONSTRAINT IF EXISTS trips_status_check
        `);
        await client.query(`
            ALTER TABLE trips 
            ADD CONSTRAINT trips_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'finished'))
        `);

        // Set all existing expenses and advances to 'approved' (backward compatibility)
        console.log('Setting existing expenses/advances to approved...');
        await client.query(`UPDATE expenses SET status = 'approved' WHERE status IS NULL`);
        await client.query(`UPDATE advances SET status = 'approved' WHERE status IS NULL`);

        console.log('Migration completed successfully!');
        await client.end();

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
