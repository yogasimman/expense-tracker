/**
 * Database Setup Script
 * 
 * This script initializes the PostgreSQL database by:
 * 1. Creating the database if it doesn't exist
 * 2. Running all schema creation scripts
 * 3. Seeding initial data
 * 
 * Usage: node database/setup.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres' // Connect to default postgres database first
};

const targetDbName = process.env.DB_NAME || 'expense_tracker';

async function setupDatabase() {
    const client = new Client(dbConfig);

    try {
        // Connect to default postgres database
        await client.connect();
        console.log('Connected to PostgreSQL server');

        // Check if database exists
        const dbCheckResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDbName]
        );

        if (dbCheckResult.rows.length === 0) {
            // Create database
            console.log(`Creating database: ${targetDbName}`);
            await client.query(`CREATE DATABASE ${targetDbName}`);
            console.log('Database created successfully');
        } else {
            console.log(`Database ${targetDbName} already exists`);
        }

        await client.end();

        // Connect to the target database
        const targetClient = new Client({
            ...dbConfig,
            database: targetDbName
        });

        await targetClient.connect();
        console.log(`Connected to ${targetDbName} database`);

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema creation...');
        await targetClient.query(schemaSql);
        console.log('Schema created successfully');

        // Verify tables were created
        const tableCheckResult = await targetClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\nCreated tables:');
        tableCheckResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        await targetClient.end();
        console.log('\n✓ Database setup completed successfully!');
        console.log('\nConnection details:');
        console.log('  Host: localhost');
        console.log('  Port: 5432');
        console.log('  Database: expense_tracker');
        console.log('  User: postgres');
        console.log('  Password: postgres');

    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

// Run setup
setupDatabase();
