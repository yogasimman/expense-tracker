require('dotenv').config();
const { query } = require('./config/database');

async function checkUsers() {
    try {
        const result = await query('SELECT id, name, email, role FROM users ORDER BY id');
        
        console.log('\n📋 Users in database:');
        console.log('='.repeat(50));
        
        if (result.rows.length === 0) {
            console.log('❌ No users found!');
            console.log('\nRun: node database/create-users.js');
        } else {
            result.rows.forEach(user => {
                console.log(`ID: ${user.id} | ${user.name} | ${user.email} | ${user.role}`);
            });
        }
        
        console.log('='.repeat(50));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
