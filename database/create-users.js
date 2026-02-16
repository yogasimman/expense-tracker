require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('../config/database');

async function createUsers() {
    try {
        console.log('Creating default users...\n');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        // Create regular user
        const regularUser = await query(`
            INSERT INTO users (name, email, password, designation, employee_id, mobile, department, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO UPDATE 
            SET password = EXCLUDED.password, role = EXCLUDED.role
            RETURNING id, name, email, employee_id, role, department
        `, ['Regular User', 'user@test.com', userPassword, 'Software Engineer', 'EMP001', '9876543210', 'Engineering', 'submitter']);

        // Create admin user
        const adminUser = await query(`
            INSERT INTO users (name, email, password, designation, employee_id, mobile, department, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (email) DO UPDATE 
            SET password = EXCLUDED.password, role = EXCLUDED.role
            RETURNING id, name, email, employee_id, role, department
        `, ['Admin User', 'admin@test.com', adminPassword, 'Manager', 'EMP999', '9999999999', 'Management', 'admin']);

        console.log('✅ Users created successfully!\n');
        console.log('==========================================');
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('==========================================\n');
        
        console.log('👤 REGULAR USER:');
        console.log('   Email:    user@test.com');
        console.log('   Password: user123');
        console.log('   Role:     Submitter');
        console.log('   Dept:     Engineering\n');
        
        console.log('👑 ADMIN USER:');
        console.log('   Email:    admin@test.com');
        console.log('   Password: admin123');
        console.log('   Role:     Admin');
        console.log('   Dept:     Management\n');
        
        console.log('==========================================');
        console.log('🌐 Go to http://localhost:5000 to login!');
        console.log('==========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating users:', error.message);
        process.exit(1);
    }
}

createUsers();
