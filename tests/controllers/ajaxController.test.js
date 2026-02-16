/**
 * Ajax Controller Tests
 * Tests all AJAX API endpoints (add-trip, add-expense, advances, categories)
 */
const { cleanTestData, createTestUser, createTestTrip, createTestCategory, closePool } = require('../setup');

// Mock req/res helpers
function mockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        url: '/',
        session: {
            user: { id: 1, role: 'submitter' }
        },
        ...overrides
    };
}

function mockRes() {
    const res = {
        _status: 200,
        _json: null,
        _rendered: null,
        status: function (code) { res._status = code; return res; },
        json: function (data) { res._json = data; return res; },
        render: function (view, data) { res._rendered = { view, data }; },
        send: function (data) { res._sent = data; }
    };
    return res;
}

const ajaxController = require('../../controllers/ajaxController');

let testUser, testTrip, testCategory;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
    testTrip = await createTestTrip(testUser.id);
    testCategory = await createTestCategory();
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Ajax Controller', () => {
    describe('add_trip()', () => {
        it('should add a trip successfully', async () => {
            const req = mockReq({
                body: {
                    tripName: 'TEST_Ajax Trip',
                    travelType: 'domestic',
                    itinerary: { flights: [], buses: [], trains: [], cabs: [] }
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_trip(req, res);
            expect(res._status).toBe(200);
            expect(res._json.message).toBe('Trip added successfully');
            expect(res._json.trip).toBeDefined();
        });

        it('should use session userId as fallback', async () => {
            const req = mockReq({
                body: {
                    tripName: 'TEST_Ajax Trip Fallback',
                    travelType: 'local',
                    itinerary: { flights: [], buses: [], trains: [], cabs: [] }
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_trip(req, res);
            expect(res._status).toBe(200);
        });

        it('should handle errors gracefully', async () => {
            const req = mockReq({
                body: {
                    tripName: '',
                    travelType: 'domestic',
                    itinerary: {}
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_trip(req, res);
            expect(res._status).toBe(500);
        });
    });

    describe('add_expense()', () => {
        it('should add an expense successfully', async () => {
            const req = mockReq({
                body: {
                    userId: testUser.id,
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_AjaxExpense',
                    amount: 100,
                    currency: 'INR',
                    description: 'Test',
                    date: new Date().toISOString()
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_expense(req, res);
            expect(res._status).toBe(200);
            expect(res._json.message).toContain('Expense added');
        });

        it('should reject when tripId is "Select"', async () => {
            const req = mockReq({
                body: {
                    userId: testUser.id,
                    tripId: 'Select',
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_BadTrip',
                    amount: 100,
                    currency: 'INR'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_expense(req, res);
            expect(res._status).toBe(400);
        });

        it('should reject when categoryId is missing', async () => {
            const req = mockReq({
                body: {
                    userId: testUser.id,
                    tripId: testTrip.id,
                    expenseTitle: 'TEST_NoCat',
                    amount: 100,
                    currency: 'INR'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_expense(req, res);
            expect(res._status).toBe(400);
        });

        it('should reject when currency is "Select"', async () => {
            const req = mockReq({
                body: {
                    userId: testUser.id,
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_BadCurrency',
                    amount: 100,
                    currency: 'Select'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_expense(req, res);
            expect(res._status).toBe(400);
        });

        it('should use session userId as fallback', async () => {
            const req = mockReq({
                body: {
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_SessionUser',
                    amount: 50,
                    currency: 'INR'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.add_expense(req, res);
            expect(res._status).toBe(200);
        });
    });

    describe('get_category()', () => {
        it('should return all categories', async () => {
            const req = mockReq();
            const res = mockRes();
            await ajaxController.get_category(req, res);
            expect(res._json).toBeDefined();
            expect(Array.isArray(res._json)).toBe(true);
        });
    });

    describe('post_category()', () => {
        it('should create a new category', async () => {
            const req = mockReq({ body: { name: 'TEST_NewCat' } });
            const res = mockRes();
            await ajaxController.post_category(req, res);
            expect(res._status).toBe(201);
            expect(res._json.name).toBe('TEST_NewCat');
        });
    });

    describe('delete_category()', () => {
        it('should delete a category', async () => {
            // Create one to delete
            const { query } = require('../../config/database');
            const result = await query(
                "INSERT INTO categories (name) VALUES ('TEST_DelCat') RETURNING *"
            );
            const catId = result.rows[0].id;

            const req = mockReq({ body: { id: catId } });
            const res = mockRes();
            await ajaxController.delete_category(req, res);
            expect(res._json.message).toContain('removed successfully');
        });

        it('should return 404 for non-existent category', async () => {
            const req = mockReq({ body: { id: 999999 } });
            const res = mockRes();
            await ajaxController.delete_category(req, res);
            expect(res._status).toBe(404);
        });
    });

    describe('addAdvances()', () => {
        it('should record an advance successfully', async () => {
            const req = mockReq({
                body: {
                    userId: testUser.id,
                    tripId: testTrip.id,
                    amount: 5000,
                    currency: 'INR',
                    paidThrough: 'cash',
                    reference: 'REF001',
                    notes: 'TEST_advance_ajax'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.addAdvances(req, res);
            expect(res._status).toBe(200);
            expect(res._json.success).toBe(true);
        });

        it('should reject when tripId is "Select"', async () => {
            const req = mockReq({
                body: {
                    tripId: 'Select',
                    amount: 100,
                    currency: 'INR',
                    paidThrough: 'cash'
                },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.addAdvances(req, res);
            expect(res._status).toBe(400);
        });

        it('should reject missing required fields', async () => {
            const req = mockReq({
                body: { tripId: testTrip.id },
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.addAdvances(req, res);
            expect(res._status).toBe(400);
        });
    });

    describe('advances() - GET page', () => {
        it('should return JSON with trips', async () => {
            const req = mockReq({
                url: '/add-advances',
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await ajaxController.advances(req, res);
            expect(res._json).toBeDefined();
            expect(Array.isArray(res._json.trips)).toBe(true);
        });
    });
});
