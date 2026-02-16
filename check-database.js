require('dotenv').config();
const { query } = require('./config/database');

async function checkDatabase() {
    try {
        console.log('\n🔍 CHECKING DATABASE STATE\n');
        console.log('='.repeat(60));
        
        // Check trips
        const trips = await query(`
            SELECT t.*, 
                   array_agg(tu.user_id) as user_ids
            FROM trips t
            LEFT JOIN trip_users tu ON t.id = tu.trip_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `);
        
        console.log('\n📍 TRIPS:');
        console.log('-'.repeat(60));
        if (trips.rows.length === 0) {
            console.log('❌ No trips found');
        } else {
            trips.rows.forEach(t => {
                console.log(`ID: ${t.id} | Name: ${t.trip_name} | Type: ${t.travel_type} | Status: ${t.status}`);
                console.log(`  User IDs: ${t.user_ids.join(', ')}`);
            });
        }
        
        // Check itinerary
        const flights = await query('SELECT trip_id, COUNT(*) as count FROM flights GROUP BY trip_id');
        const buses = await query('SELECT trip_id, COUNT(*) as count FROM buses GROUP BY trip_id');
        const trains = await query('SELECT trip_id, COUNT(*) as count FROM trains GROUP BY trip_id');
        const cabs = await query('SELECT trip_id, COUNT(*) as count FROM cabs GROUP BY trip_id');
        
        console.log('\n✈️  ITINERARY:');
        console.log('-'.repeat(60));
        console.log(`Flights: ${flights.rows.length > 0 ? flights.rows.map(f => `Trip ${f.trip_id}: ${f.count}`).join(', ') : 'None'}`);
        console.log(`Buses: ${buses.rows.length > 0 ? buses.rows.map(b => `Trip ${b.trip_id}: ${b.count}`).join(', ') : 'None'}`);
        console.log(`Trains: ${trains.rows.length > 0 ? trains.rows.map(t => `Trip ${t.trip_id}: ${t.count}`).join(', ') : 'None'}`);
        console.log(`Cabs: ${cabs.rows.length > 0 ? cabs.rows.map(c => `Trip ${c.trip_id}: ${c.count}`).join(', ') : 'None'}`);
        
        // Check expenses
        const expenses = await query('SELECT * FROM expenses ORDER BY created_at DESC');
        console.log('\n💰 EXPENSES:');
        console.log('-'.repeat(60));
        if (expenses.rows.length === 0) {
            console.log('❌ No expenses found');
        } else {
            expenses.rows.forEach(e => {
                console.log(`ID: ${e.id} | Title: ${e.expense_title} | Amount: ${e.amount} ${e.currency}`);
                console.log(`  Trip ID: ${e.trip_id} | User ID: ${e.user_id} | Category: ${e.category_id}`);
            });
        }
        
        // Check advances
        const advances = await query('SELECT * FROM advances ORDER BY created_at DESC');
        console.log('\n💵 ADVANCES:');
        console.log('-'.repeat(60));
        if (advances.rows.length === 0) {
            console.log('❌ No advances found');
        } else {
            advances.rows.forEach(a => {
                console.log(`ID: ${a.id} | Amount: ${a.amount} ${a.currency}`);
                console.log(`  Trip ID: ${a.trip_id} | User ID: ${a.user_id}`);
            });
        }
        
        // Check categories
        const categories = await query('SELECT * FROM categories ORDER BY id');
        console.log('\n📂 CATEGORIES:');
        console.log('-'.repeat(60));
        categories.rows.forEach(c => {
            console.log(`ID: ${c.id} | ${c.name}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkDatabase();
