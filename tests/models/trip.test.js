/**
 * Trip Model Tests
 */
const { cleanTestData, createTestUser, createTestTrip, closePool } = require('../setup');
const Trip = require('../../models/tripModel');

let testUser;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Trip Model', () => {
    let testTrip;

    describe('create()', () => {
        it('should create a trip with valid data', async () => {
            testTrip = await createTestTrip(testUser.id);
            expect(testTrip).toBeDefined();
            expect(testTrip.id).toBeDefined();
            expect(testTrip.tripName).toBeDefined();
            expect(testTrip.travelType).toBe('domestic');
            expect(testTrip.status).toBe('pending');
            expect(testTrip.userId).toContain(testUser.id);
        });

        it('should create trip with full itinerary', async () => {
            const trip = await Trip.create({
                tripName: 'TEST_Full_Itinerary_' + Date.now(),
                travelType: 'international',
                userId: [testUser.id],
                itinerary: {
                    flights: [{ departFrom: 'Chennai', arriveAt: 'London', departureDate: '2026-04-01', returnDate: '2026-04-10', description: 'Business' }],
                    buses: [{ departFrom: 'London', arriveAt: 'Oxford', departureDate: '2026-04-02', description: 'Day trip' }],
                    trains: [{ departFrom: 'London', arriveAt: 'Edinburgh', departureDate: '2026-04-03', description: 'Sightseeing' }],
                    cabs: [{ pickUpLocation: 'Airport', dropOffLocation: 'Hotel', pickUpDate: '2026-04-01', description: 'Transfer' }]
                }
            });

            expect(trip.itinerary.flights).toHaveLength(1);
            expect(trip.itinerary.flights[0].departFrom).toBe('Chennai');
            expect(trip.itinerary.buses).toHaveLength(1);
            expect(trip.itinerary.trains).toHaveLength(1);
            expect(trip.itinerary.cabs).toHaveLength(1);
        });

        it('should reject empty trip name', async () => {
            await expect(
                Trip.create({ tripName: '', travelType: 'domestic', userId: [testUser.id] })
            ).rejects.toThrow('Trip name is required');
        });

        it('should reject missing travel type', async () => {
            await expect(
                Trip.create({ tripName: 'TEST_NoType_' + Date.now(), userId: [testUser.id] })
            ).rejects.toThrow('Travel type is required');
        });

        it('should support multiple users', async () => {
            const user2 = await createTestUser();
            const trip = await Trip.create({
                tripName: 'TEST_MultiUser_' + Date.now(),
                travelType: 'domestic',
                userId: [testUser.id, user2.id],
                itinerary: { flights: [], buses: [], trains: [], cabs: [] }
            });
            expect(trip.userId).toContain(testUser.id);
            expect(trip.userId).toContain(user2.id);
        });
    });

    describe('findById()', () => {
        it('should find trip with details', async () => {
            const found = await Trip.findById(testTrip.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(testTrip.id);
            expect(found.tripName).toBeDefined();
            expect(found.itinerary).toBeDefined();
            expect(found.userId).toBeDefined();
        });

        it('should return null for non-existent id', async () => {
            const found = await Trip.findById(999999);
            expect(found).toBeNull();
        });
    });

    describe('findAll()', () => {
        it('should return all trips', async () => {
            const trips = await Trip.findAll();
            expect(Array.isArray(trips)).toBe(true);
            expect(trips.length).toBeGreaterThan(0);
        });

        it('should filter by userId', async () => {
            const trips = await Trip.findAll({ userId: testUser.id });
            expect(trips.length).toBeGreaterThan(0);
            trips.forEach(t => expect(t.userId).toContain(testUser.id));
        });

        it('should filter by status', async () => {
            const trips = await Trip.findAll({ status: 'pending' });
            trips.forEach(t => expect(t.status).toBe('pending'));
        });
    });

    describe('findByUserId()', () => {
        it('should return trips for user', async () => {
            const trips = await Trip.findByUserId(testUser.id);
            expect(trips.length).toBeGreaterThan(0);
        });
    });

    describe('update()', () => {
        it('should update trip name', async () => {
            const newName = 'TEST_Updated_' + Date.now();
            const updated = await Trip.update(testTrip.id, { tripName: newName });
            expect(updated.tripName).toBe(newName);
        });

        it('should update trip status', async () => {
            const updated = await Trip.update(testTrip.id, { status: 'approved' });
            expect(updated.status).toBe('approved');
        });
    });

    describe('updateStatus()', () => {
        it('should update status directly', async () => {
            const trip = await createTestTrip(testUser.id);
            const updated = await Trip.updateStatus(trip.id, 'approved');
            expect(updated.status).toBe('approved');
        });
    });

    describe('getStatistics()', () => {
        it('should return trip statistics', async () => {
            const stats = await Trip.getStatistics(testTrip.id);
            expect(stats).toBeDefined();
            expect(stats.total_expenses).toBeDefined();
            expect(stats.total_advances).toBeDefined();
        });
    });

    describe('delete()', () => {
        it('should delete a pending trip', async () => {
            const trip = await createTestTrip(testUser.id);
            const deleted = await Trip.delete(trip.id);
            expect(deleted).toBeDefined();
        });

        it('should reject deleting an approved trip', async () => {
            const trip = await createTestTrip(testUser.id);
            await Trip.updateStatus(trip.id, 'approved');
            await expect(Trip.delete(trip.id)).rejects.toThrow('Cannot delete an approved trip');
        });

        it('should throw for non-existent trip', async () => {
            await expect(Trip.delete(999999)).rejects.toThrow('Trip not found');
        });
    });
});
