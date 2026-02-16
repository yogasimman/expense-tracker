require('dotenv').config();
const Trip = require('./models/tripModel');

async function testTripCreation() {
    try {
        console.log('Testing trip creation...\n');

        const tripData = {
            tripName: 'Test Trip',
            travelType: 'domestic',
            status: 'pending',
            userId: 2, // Using the regular user we created (user@test.com)
            itinerary: {
                flights: [
                    {
                        departFrom: 'Chennai',
                        arriveAt: 'Mumbai',
                        departureDate: '2026-03-01',
                        returnDate: '2026-03-05',
                        description: 'Business meeting'
                    }
                ],
                buses: [],
                trains: [],
                cabs: []
            }
        };

        console.log('Creating trip with data:', JSON.stringify(tripData, null, 2));

        const result = await Trip.create(tripData);
        
        console.log('\n✅ Trip created successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error creating trip:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testTripCreation();
