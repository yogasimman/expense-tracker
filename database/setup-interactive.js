/**
 * Interactive Database Setup Script
 * Prompts for PostgreSQL password and creates the database
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupDatabase() {
    console.log('\n=== PostgreSQL Database Setup ===\n');
    
    // Get credentials from user
    const host = await question('PostgreSQL Host [localhost]: ') || 'localhost';
    const port = await question('PostgreSQL Port [5432]: ') || '5432';
    const user = await question('PostgreSQL Username [postgres]: ') || 'postgres';
    const password = await question('PostgreSQL Password: ');
    
    if (!password) {
        console.error('\n❌ Password is required!');
        rl.close();
        process.exit(1);
    }

    const targetDbName = 'expense_tracker';
    
    // Database configuration
    const dbConfig = {
        user: user,
        password: password,
        host: host,
        port: parseInt(port),
        database: 'postgres'
    };

    const client = new Client(dbConfig);

    try {
        // Connect to default postgres database
        console.log('\n⏳ Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Check if database exists
        const dbCheckResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDbName]
        );

        if (dbCheckResult.rows.length === 0) {
            console.log(`\n⏳ Creating database: ${targetDbName}...`);
            await client.query(`CREATE DATABASE ${targetDbName}`);
            console.log('✅ Database created successfully!');
        } else {
            console.log(`\n✅ Database ${targetDbName} already exists`);
        }

        await client.end();

        // Connect to the target database
        console.log(`\n⏳ Connecting to ${targetDbName} database...`);
        const targetClient = new Client({
            ...dbConfig,
            database: targetDbName
        });

        await targetClient.connect();
        console.log('✅ Connected!');

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        console.log('\n⏳ Reading schema file...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⏳ Creating tables and schema...');
        await targetClient.query(schemaSql);
        console.log('✅ Schema created successfully!');

        // Verify tables were created
        const tableCheckResult = await targetClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\n✅ Created tables:');
        tableCheckResult.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });

        await targetClient.end();
        
        console.log('\n🎉 Database setup completed successfully!\n');
        console.log('📝 Update your config/database.js and database/setup.js with these credentials:\n');
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Database: ${targetDbName}`);
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${password}\n`);
        console.log('▶️  You can now run: npm start\n');

    } catch (error) {
        console.error('\n❌ Error setting up database:', error.message);
        if (error.code === '28P01') {
            console.error('\n💡 Authentication failed. Please check your password and try again.');
        }
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run setup
setupDatabase();
