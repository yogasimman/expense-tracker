/**
 * Advance Model Tests
 */
const { cleanTestData, createTestUser, createTestTrip, closePool } = require('../setup');
const Advance = require('../../models/advancesModel');

let testUser, testTrip;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
    testTrip = await createTestTrip(testUser.id);
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Advance Model', () => {
    let testAdvance;

    describe('create()', () => {
        it('should create an advance with valid data', async () => {
            testAdvance = await Advance.create({
                userId: testUser.id,
                tripId: testTrip.id,
                amount: 5000,
                currency: 'INR',
                paidThrough: 'bank_transfer',
                referenceId: 'REF123',
                notes: 'TEST_advance_initial'
            });

            expect(testAdvance).toBeDefined();
            expect(testAdvance.id).toBeDefined();
            expect(parseFloat(testAdvance.amount)).toBe(5000);
            expect(testAdvance.currency).toBe('INR');
            expect(testAdvance.paid_through).toBe('bank_transfer');
            expect(testAdvance.reference_id).toBe('REF123');
        });

        it('should create an advance without optional fields', async () => {
            const adv = await Advance.create({
                userId: testUser.id,
                tripId: testTrip.id,
                amount: 1000,
                currency: 'USD',
                paidThrough: 'cash',
                notes: 'TEST_advance_minimal'
            });
            expect(adv).toBeDefined();
            expect(adv.reference_id).toBeNull();
        });

        it('should reject invalid foreign keys', async () => {
            await expect(
                Advance.create({
                    userId: 999999,
                    tripId: testTrip.id,
                    amount: 100,
                    currency: 'INR',
                    paidThrough: 'cash',
                    notes: 'TEST_advance_bad'
                })
            ).rejects.toThrow();
        });
    });

    describe('findById()', () => {
        it('should find advance by id with joins', async () => {
            const found = await Advance.findById(testAdvance.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(testAdvance.id);
            expect(found.user_name).toBeDefined();
            expect(found.trip_name).toBeDefined();
        });

        it('should return undefined for non-existent id', async () => {
            const found = await Advance.findById(999999);
            expect(found).toBeUndefined();
        });
    });

    describe('findAll()', () => {
        it('should return all advances', async () => {
            const advances = await Advance.findAll();
            expect(Array.isArray(advances)).toBe(true);
            expect(advances.length).toBeGreaterThan(0);
        });

        it('should filter by userId', async () => {
            const advances = await Advance.findAll({ userId: testUser.id });
            advances.forEach(a => expect(a.user_id).toBe(testUser.id));
        });

        it('should filter by tripId', async () => {
            const advances = await Advance.findAll({ tripId: testTrip.id });
            advances.forEach(a => expect(a.trip_id).toBe(testTrip.id));
        });

        it('should filter by currency', async () => {
            const advances = await Advance.findAll({ currency: 'INR' });
            advances.forEach(a => expect(a.currency).toBe('INR'));
        });
    });

    describe('findByUserId()', () => {
        it('should return advances for user', async () => {
            const advances = await Advance.findByUserId(testUser.id);
            expect(advances.length).toBeGreaterThan(0);
            advances.forEach(a => expect(a.user_id).toBe(testUser.id));
        });
    });

    describe('findByTripId()', () => {
        it('should return advances for trip', async () => {
            const advances = await Advance.findByTripId(testTrip.id);
            expect(advances.length).toBeGreaterThan(0);
            advances.forEach(a => expect(a.trip_id).toBe(testTrip.id));
        });
    });

    describe('update()', () => {
        it('should update advance fields', async () => {
            const updated = await Advance.update(testAdvance.id, { amount: 7500 });
            expect(parseFloat(updated.amount)).toBe(7500);
        });

        it('should throw for empty update', async () => {
            await expect(Advance.update(testAdvance.id, {})).rejects.toThrow('No fields to update');
        });

        it('should ignore non-allowed fields', async () => {
            await expect(Advance.update(testAdvance.id, { fake_field: 'nope' })).rejects.toThrow('No fields to update');
        });
    });

    describe('getStatistics()', () => {
        it('should return statistics', async () => {
            const stats = await Advance.getStatistics({ userId: testUser.id });
            expect(stats).toBeDefined();
            expect(parseInt(stats.total_count)).toBeGreaterThan(0);
            expect(parseFloat(stats.total_amount)).toBeGreaterThan(0);
        });
    });

    describe('getTotalByTripId()', () => {
        it('should return totals grouped by currency', async () => {
            const totals = await Advance.getTotalByTripId(testTrip.id);
            expect(Array.isArray(totals)).toBe(true);
            expect(totals.length).toBeGreaterThan(0);
            totals.forEach(t => {
                expect(t.currency).toBeDefined();
                expect(parseFloat(t.total_amount)).toBeGreaterThan(0);
            });
        });
    });

    describe('getTotalByUserId()', () => {
        it('should return totals grouped by currency for user', async () => {
            const totals = await Advance.getTotalByUserId(testUser.id);
            expect(Array.isArray(totals)).toBe(true);
            expect(totals.length).toBeGreaterThan(0);
        });
    });

    describe('delete()', () => {
        it('should delete advance', async () => {
            const adv = await Advance.create({
                userId: testUser.id,
                tripId: testTrip.id,
                amount: 100,
                currency: 'INR',
                paidThrough: 'cash',
                notes: 'TEST_advance_delete'
            });
            const deleted = await Advance.delete(adv.id);
            expect(deleted.id).toBe(adv.id);
            const found = await Advance.findById(adv.id);
            expect(found).toBeUndefined();
        });
    });
});
