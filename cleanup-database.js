require('dotenv').config();
const { query } = require('./config/database');

async function cleanup() {
    try {
        console.log('🧹 Cleaning up database...\n');
        
        // Delete trips with empty names
        const result = await query(`
            DELETE FROM trips 
            WHERE trip_name IS NULL OR trip_name = ''
            RETURNING id, trip_name
        `);
        
        console.log(`✅ Deleted ${result.rows.length} trips with empty names`);
        
        if (result.rows.length > 0) {
            result.rows.forEach(t => {
                console.log(`  - Trip ID: ${t.id}`);
            });
        }
        
        console.log('\n✨ Database cleaned up!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanup();
