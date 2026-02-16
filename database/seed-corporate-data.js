/**
 * Corporate Simulation Data Seed Script
 * Seeds realistic corporate expense tracking data for testing
 *
 * Usage:  node database/seed-corporate-data.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, query, getClient } = require('../config/database');

async function seed() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    console.log('🏢 Seeding corporate simulation data...\n');

    // ── 1. Categories ──────────────────────────────────
    const defaultCategories = [
      'Travel', 'Meals', 'Accommodation', 'Entertainment',
      'Communication', 'Supplies', 'Fuel', 'Parking', 'Other'
    ];
    const categoryIds = {};
    for (const name of defaultCategories) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [name]
      );
      categoryIds[name] = res.rows[0].id;
    }
    console.log(`✓ ${Object.keys(categoryIds).length} categories ready`);

    // ── 2. Users ───────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);
    const usersData = [
      { name: 'Admin User', email: 'admin@nexacorp.com', employee_id: 'NX-001', department: 'Administration', designation: 'System Administrator', mobile: '9876543210', role: 'admin' },
      { name: 'Rajesh Kumar', email: 'rajesh.kumar@nexacorp.com', employee_id: 'NX-101', department: 'Engineering', designation: 'Senior Engineer', mobile: '9876543211', role: 'submitter' },
      { name: 'Priya Sharma', email: 'priya.sharma@nexacorp.com', employee_id: 'NX-102', department: 'Sales', designation: 'Sales Manager', mobile: '9876543212', role: 'submitter' },
      { name: 'Arun Patel', email: 'arun.patel@nexacorp.com', employee_id: 'NX-103', department: 'Marketing', designation: 'Marketing Lead', mobile: '9876543213', role: 'submitter' },
      { name: 'Deepa Nair', email: 'deepa.nair@nexacorp.com', employee_id: 'NX-104', department: 'Engineering', designation: 'Tech Lead', mobile: '9876543214', role: 'submitter' },
      { name: 'Vikram Singh', email: 'vikram.singh@nexacorp.com', employee_id: 'NX-105', department: 'Finance', designation: 'Finance Manager', mobile: '9876543215', role: 'approver' },
      { name: 'Meera Iyer', email: 'meera.iyer@nexacorp.com', employee_id: 'NX-106', department: 'HR', designation: 'HR Director', mobile: '9876543216', role: 'admin' },
      { name: 'Suresh Reddy', email: 'suresh.reddy@nexacorp.com', employee_id: 'NX-107', department: 'Engineering', designation: 'Junior Developer', mobile: '9876543217', role: 'submitter' },
    ];

    const userIds = {};
    for (const u of usersData) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length) {
        userIds[u.email] = existing.rows[0].id;
      } else {
        const res = await client.query(
          `INSERT INTO users (name, email, password, employee_id, department, designation, mobile, role)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [u.name, u.email, hash, u.employee_id, u.department, u.designation, u.mobile, u.role]
        );
        userIds[u.email] = res.rows[0].id;
      }
    }
    console.log(`✓ ${Object.keys(userIds).length} users seeded  (password: password123)`);

    // ── 3. Trips ───────────────────────────────────────
    const tripsData = [
      { name: 'Client Meeting - Mumbai', type: 'domestic', user: 'rajesh.kumar@nexacorp.com', status: 'approved', description: 'Quarterly review meeting with TCS at their Mumbai HQ to discuss project milestones and deliverables.' },
      { name: 'AWS Summit - Bangalore', type: 'domestic', user: 'deepa.nair@nexacorp.com', status: 'approved', description: 'Attending AWS Summit 2026 for cloud architecture training and vendor evaluation.' },
      { name: 'Sales Pitch - Delhi', type: 'domestic', user: 'priya.sharma@nexacorp.com', status: 'approved', description: 'New business pitch to Bharti Airtel for enterprise software licensing deal.' },
      { name: 'Marketing Conference - Hyderabad', type: 'domestic', user: 'arun.patel@nexacorp.com', status: 'pending', description: 'Annual Digital Marketing Summit. Presenting NexaCorp case study on B2B growth strategies.' },
      { name: 'Team Offsite - Goa', type: 'domestic', user: 'rajesh.kumar@nexacorp.com', status: 'pending', description: 'Engineering team quarterly offsite for sprint planning and team building activities.' },
      { name: 'Vendor Negotiation - Singapore', type: 'international', user: 'priya.sharma@nexacorp.com', status: 'approved', description: 'Meeting with hardware vendor GlobalTech for annual contract renewal and pricing negotiation.' },
      { name: 'Tech Workshop - Pune', type: 'domestic', user: 'suresh.reddy@nexacorp.com', status: 'rejected', description: 'React advanced workshop. Rejected due to budget constraints for Q1.' },
      { name: 'Office Inspection - Local', type: 'local', user: 'meera.iyer@nexacorp.com', status: 'approved', description: 'Quarterly inspection of branch office facilities and employee workspace audit.' },
      { name: 'Finance Audit - Chennai', type: 'domestic', user: 'vikram.singh@nexacorp.com', status: 'approved', description: 'Internal audit of Chennai branch financial records and compliance verification.' },
      { name: 'Product Launch - London', type: 'international', user: 'arun.patel@nexacorp.com', status: 'pending', description: 'NexaCorp Cloud Suite launch event at ExCeL London. Coordinating with UK marketing team.' },
    ];

    const tripIds = [];
    for (const t of tripsData) {
      const uid = userIds[t.user];
      const res = await client.query(
        `INSERT INTO trips (trip_name, travel_type, status, description) VALUES ($1,$2,$3,$4) RETURNING id`,
        [t.name, t.type, t.status, t.description || null]
      );
      const tripId = res.rows[0].id;
      await client.query('INSERT INTO trip_users (trip_id, user_id) VALUES ($1,$2)', [tripId, uid]);
      tripIds.push({ id: tripId, ...t, userId: uid });
    }
    console.log(`✓ ${tripIds.length} trips created`);

    // ── 4. Itinerary (flights, trains, cabs) ───────────
    const approvedTrips = tripIds.filter(t => t.status === 'approved');

    // Add flights to international trips
    for (const t of tripIds.filter(t => t.type === 'international')) {
      await client.query(
        `INSERT INTO flights (trip_id, depart_from, arrive_at, departure_date, return_date, description)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.id, 'Chennai', t.name.includes('Singapore') ? 'Singapore' : 'London',
         '2026-03-15 06:00', '2026-03-20 18:00', 'Round trip economy class']
      );
    }

    // Add trains to domestic trips
    for (const t of tripIds.filter(t => t.type === 'domestic').slice(0, 3)) {
      const dest = t.name.split(' - ')[1] || 'Mumbai';
      await client.query(
        `INSERT INTO trains (trip_id, depart_from, arrive_at, departure_date, description)
         VALUES ($1,$2,$3,$4,$5)`,
        [t.id, 'Chennai', dest, '2026-02-20 08:00', 'AC First Class']
      );
    }

    // Add cabs to local trips
    for (const t of tripIds.filter(t => t.type === 'local')) {
      await client.query(
        `INSERT INTO cabs (trip_id, pick_up_location, drop_off_location, pick_up_date, description)
         VALUES ($1,$2,$3,$4,$5)`,
        [t.id, 'Office - OMR', 'Branch Office - T.Nagar', '2026-02-18 09:00', 'Ola Prime sedan']
      );
    }
    console.log('✓ Itinerary items added');

    // ── 5. Expenses ────────────────────────────────────
    const expensesData = [
      // Trip 0 - Mumbai client meeting (approved)
      { trip: 0, cat: 'Travel', title: 'Flight Chennai-Mumbai', amount: 5200, cur: 'INR', desc: 'IndiGo 6E-234 round trip', date: '2026-02-10' },
      { trip: 0, cat: 'Accommodation', title: 'Hotel Taj Lands End - 2 nights', amount: 12000, cur: 'INR', desc: 'Deluxe room, corporate rate', date: '2026-02-10' },
      { trip: 0, cat: 'Meals', title: 'Client Dinner at Wasabi', amount: 3500, cur: 'INR', desc: 'Dinner with TCS team (4 people)', date: '2026-02-11' },
      { trip: 0, cat: 'Fuel', title: 'Airport Cab', amount: 850, cur: 'INR', desc: 'Uber from airport to hotel and back', date: '2026-02-10' },
      // Trip 1 - AWS Summit (approved)
      { trip: 1, cat: 'Travel', title: 'Train Chennai-Bangalore', amount: 1200, cur: 'INR', desc: 'Shatabdi Express AC Chair Car', date: '2026-02-15' },
      { trip: 1, cat: 'Accommodation', title: 'Lemon Tree Hotel - 3 nights', amount: 9000, cur: 'INR', desc: 'Standard room near convention center', date: '2026-02-15' },
      { trip: 1, cat: 'Meals', title: 'Working Lunch Day 1', amount: 450, cur: 'INR', desc: 'Lunch during summit break', date: '2026-02-16' },
      { trip: 1, cat: 'Meals', title: 'Team Dinner Day 2', amount: 1800, cur: 'INR', desc: 'Dinner with engineering peers', date: '2026-02-17' },
      { trip: 1, cat: 'Communication', title: 'Conference WiFi Pass', amount: 500, cur: 'INR', desc: 'Premium WiFi for demos', date: '2026-02-15' },
      // Trip 2 - Sales Delhi (approved)
      { trip: 2, cat: 'Travel', title: 'Flight Chennai-Delhi', amount: 6800, cur: 'INR', desc: 'Air India round trip', date: '2026-02-20' },
      { trip: 2, cat: 'Accommodation', title: 'ITC Maurya - 2 nights', amount: 15000, cur: 'INR', desc: 'Business suite near Airtel office', date: '2026-02-20' },
      { trip: 2, cat: 'Entertainment', title: 'Client Entertainment', amount: 8000, cur: 'INR', desc: 'Business dinner with Airtel procurement team', date: '2026-02-21' },
      { trip: 2, cat: 'Supplies', title: 'Printed Proposals', amount: 1200, cur: 'INR', desc: '50 copies of proposal document', date: '2026-02-20' },
      { trip: 2, cat: 'Parking', title: 'Airport Parking', amount: 600, cur: 'INR', desc: '2-day parking at Chennai airport', date: '2026-02-20' },
      // Trip 5 - Singapore vendor (approved)
      { trip: 5, cat: 'Travel', title: 'Flight Chennai-Singapore', amount: 850, cur: 'USD', desc: 'Singapore Airlines SQ529 round trip', date: '2026-03-15' },
      { trip: 5, cat: 'Accommodation', title: 'Marina Bay Sands - 4 nights', amount: 1200, cur: 'USD', desc: 'City view room, corporate rate', date: '2026-03-15' },
      { trip: 5, cat: 'Meals', title: 'Vendor Lunch Meeting', amount: 120, cur: 'USD', desc: 'Lunch with GlobalTech representatives', date: '2026-03-16' },
      { trip: 5, cat: 'Fuel', title: 'Grab rides', amount: 80, cur: 'USD', desc: 'Local transportation for 4 days', date: '2026-03-15' },
      // Trip 7 - Local inspection (approved)
      { trip: 7, cat: 'Fuel', title: 'Cab to branch office', amount: 350, cur: 'INR', desc: 'Ola ride OMR to T.Nagar', date: '2026-02-18' },
      { trip: 7, cat: 'Meals', title: 'Working Lunch', amount: 300, cur: 'INR', desc: 'Lunch during branch visit', date: '2026-02-18' },
      { trip: 7, cat: 'Supplies', title: 'Stationery Restock', amount: 750, cur: 'INR', desc: 'Notebooks and pens for branch office', date: '2026-02-18' },
      // Trip 8 - Finance audit Chennai (approved)
      { trip: 8, cat: 'Travel', title: 'Local Travel', amount: 400, cur: 'INR', desc: 'Auto and cab within Chennai', date: '2026-02-25' },
      { trip: 8, cat: 'Meals', title: 'Working Meals - 3 days', amount: 1500, cur: 'INR', desc: 'Meals during audit days', date: '2026-02-25' },
      { trip: 8, cat: 'Supplies', title: 'Audit Documents Printing', amount: 950, cur: 'INR', desc: 'Financial reports and compliance docs', date: '2026-02-25' },
    ];

    let expCount = 0;
    for (const e of expensesData) {
      const trip = tripIds[e.trip];
      if (trip.status !== 'approved') continue;
      await client.query(
        `INSERT INTO expenses (user_id, trip_id, category_id, expense_title, amount, currency, description, date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [trip.userId, trip.id, categoryIds[e.cat], e.title, e.amount, e.cur, e.desc, e.date]
      );
      expCount++;
    }
    console.log(`✓ ${expCount} expenses created`);

    // ── 6. Advances ────────────────────────────────────
    const advancesData = [
      { trip: 0, amount: 15000, cur: 'INR', paid: 'Bank Transfer', ref: 'NEFT-20260208-001', notes: 'Travel advance for Mumbai client visit' },
      { trip: 1, amount: 8000, cur: 'INR', paid: 'Bank Transfer', ref: 'NEFT-20260213-002', notes: 'Advance for AWS Summit registration and accommodation' },
      { trip: 2, amount: 20000, cur: 'INR', paid: 'Company Card', ref: 'CC-20260218-003', notes: 'Advance for Delhi sales trip - flights and hotel' },
      { trip: 5, amount: 2000, cur: 'USD', paid: 'Wire Transfer', ref: 'SWIFT-20260310-004', notes: 'International advance for Singapore vendor meeting' },
      { trip: 7, amount: 2000, cur: 'INR', paid: 'Cash', ref: 'CASH-20260217-005', notes: 'Petty cash for local branch inspection' },
      { trip: 8, amount: 5000, cur: 'INR', paid: 'Bank Transfer', ref: 'NEFT-20260223-006', notes: 'Advance for Chennai audit travel and meals' },
    ];

    let advCount = 0;
    for (const a of advancesData) {
      const trip = tripIds[a.trip];
      if (trip.status !== 'approved') continue;
      await client.query(
        `INSERT INTO advances (user_id, trip_id, amount, currency, paid_through, reference_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [trip.userId, trip.id, a.amount, a.cur, a.paid, a.ref, a.notes]
      );
      advCount++;
    }
    console.log(`✓ ${advCount} advances created`);

    await client.query('COMMIT');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Corporate simulation data seeded!\n');
    console.log('Login credentials (all users):');
    console.log('  Password:  password123\n');
    console.log('Admin accounts:');
    console.log('  admin@nexacorp.com');
    console.log('  meera.iyer@nexacorp.com\n');
    console.log('Employee accounts:');
    console.log('  rajesh.kumar@nexacorp.com  (Engineering)');
    console.log('  priya.sharma@nexacorp.com  (Sales)');
    console.log('  arun.patel@nexacorp.com    (Marketing)');
    console.log('  deepa.nair@nexacorp.com    (Engineering)');
    console.log('  vikram.singh@nexacorp.com  (Finance)');
    console.log('  suresh.reddy@nexacorp.com  (Engineering)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
