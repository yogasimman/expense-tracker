/**
 * Simple PostgreSQL Connection Test
 * Tests if you can connect with your credentials
 */

require('dotenv').config();
const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection() {
    console.log('\n=== PostgreSQL Connection Test ===\n');
    
    // Check if .env exists
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('✅ Found .env file\n');
        
        // Try with .env credentials first
        const client = new Client({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'postgres'
        });

        try {
            console.log('⏳ Testing connection with .env credentials...');
            await client.connect();
            const result = await client.query('SELECT version()');
            console.log('\n✅ SUCCESS! Connected to PostgreSQL!\n');
            console.log('Database Version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
            await client.end();
            console.log('\n💡 Your credentials work! You can now run:');
            console.log('   node database/setup.js');
            console.log('\nOr start the server:');
            console.log('   npm start\n');
            rl.close();
            return;
        } catch (error) {
            console.log('❌ Failed with .env credentials');
            console.log('Error:', error.message);
            console.log('\nLet\'s try manually...\n');
        }
    } else {
        console.log('⚠️  No .env file found. Will test manually.\n');
    }

    // Manual test
    const password = await question('Enter PostgreSQL password: ');
    
    if (!password) {
        console.error('\n❌ Password is required!');
        rl.close();
        process.exit(1);
    }

    const client = new Client({
        user: 'postgres',
        password: password,
        host: 'localhost',
        port: 5432,
        database: 'postgres'
    });

    try {
        console.log('\n⏳ Testing connection...');
        await client.connect();
        const result = await client.query('SELECT version()');
        console.log('\n✅ SUCCESS! Connected to PostgreSQL!\n');
        console.log('Database Version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
        await client.end();
        
        console.log('\n💡 Your password works! Next steps:\n');
        console.log('1. Create .env file:');
        console.log('   copy .env.example .env');
        console.log('\n2. Edit .env and set:');
        console.log(`   DB_PASSWORD=${password}`);
        console.log('\n3. Run database setup:');
        console.log('   node database/setup.js');
        console.log('\n4. Start the server:');
        console.log('   npm start\n');
        
    } catch (error) {
        console.error('\n❌ Connection Failed!');
        console.error('Error:', error.message);
        
        if (error.code === '28P01') {
            console.log('\n💡 Wrong password! Try these steps:\n');
            console.log('1. Check your PostgreSQL installation password');
            console.log('2. Or reset it following the guide in START_HERE.md');
            console.log('3. Run this test again\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 PostgreSQL is not running! Start it:\n');
            console.log('PowerShell (as Admin):');
            console.log('   Start-Service postgresql-x64-18\n');
        } else {
            console.log('\n💡 Check START_HERE.md for troubleshooting\n');
        }
    } finally {
        rl.close();
    }
}

testConnection();
