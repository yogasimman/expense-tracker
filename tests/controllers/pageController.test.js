/**
 * Page Controller Tests
 * Tests page redirect functions and addUser
 */
const { cleanTestData, createTestUser, createTestTrip, closePool } = require('../setup');

function mockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        url: '/',
        cookies: {},
        session: {
            user: { id: 1, name: 'Test', role: 'submitter' }
        },
        ...overrides
    };
}

function mockRes() {
    const res = {
        _status: 200,
        _json: null,
        _redirectUrl: null,
        _sent: null,
        status: function (code) { res._status = code; return res; },
        json: function (data) { res._json = data; return res; },
        redirect: function (url) { res._redirectUrl = url; },
        send: function (data) { res._sent = data; }
    };
    return res;
}

const pageController = require('../../controllers/pageController');

let testUser, testAdminUser, testTrip;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser({ role: 'submitter' });
    testAdminUser = await createTestUser({ role: 'admin' });
    testTrip = await createTestTrip(testUser.id);
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Page Controller', () => {
    describe('settings()', () => {
        it('should redirect to /app/settings', () => {
            const req = mockReq({ url: '/settings' });
            const res = mockRes();
            pageController.settings(req, res);
            expect(res._redirectUrl).toBe('/app/settings');
        });
    });

    describe('expenses()', () => {
        it('should redirect to /app/expenses', () => {
            const req = mockReq({ url: '/expenses' });
            const res = mockRes();
            pageController.expenses(req, res);
            expect(res._redirectUrl).toBe('/app/expenses');
        });
    });

    describe('trips()', () => {
        it('should redirect to /app/trips', () => {
            const req = mockReq({ url: '/trips' });
            const res = mockRes();
            pageController.trips(req, res);
            expect(res._redirectUrl).toBe('/app/trips');
        });
    });

    describe('advances()', () => {
        it('should redirect to /app/advances', () => {
            const req = mockReq({ url: '/advances' });
            const res = mockRes();
            pageController.advances(req, res);
            expect(res._redirectUrl).toBe('/app/advances');
        });
    });

    describe('approvals()', () => {
        it('should redirect to /app/approvals', () => {
            const req = mockReq({ url: '/approvals' });
            const res = mockRes();
            pageController.approvals(req, res);
            expect(res._redirectUrl).toBe('/app/approvals');
        });
    });

    describe('addUser()', () => {
        it('should add a new user', async () => {
            const suffix = Date.now();
            const req = mockReq({
                body: {
                    name: `Test AddUser ${suffix}`,
                    email: `test_adduser_${suffix}@test.com`,
                    password: 'password123',
                    employeeId: `TEST_EMP_${suffix}`,
                    mobile: '9876543210',
                    department: 'Engineering',
                    designation: 'Developer',
                    role: 'submitter'
                }
            });
            const res = mockRes();
            await pageController.addUser(req, res);
            expect(res._json.message).toContain('User added');
        });

        it('should reject missing password', async () => {
            const req = mockReq({
                body: {
                    name: 'No Pass',
                    email: 'test_nopass@test.com'
                }
            });
            const res = mockRes();
            await pageController.addUser(req, res);
            expect(res._status).toBe(400);
        });

        it('should reject duplicate email', async () => {
            const req = mockReq({
                body: {
                    name: 'Dup User',
                    email: testUser.email,
                    password: 'password123',
                    employeeId: 'DUP_001',
                    mobile: '1111111111',
                    department: 'Test',
                    designation: 'Test',
                    role: 'submitter'
                }
            });
            const res = mockRes();
            await pageController.addUser(req, res);
            expect(res._status).toBe(400);
            expect(res._json.message).toContain('Email already exists');
        });
    });

    describe('viewtrips()', () => {
        it('should redirect to /app/trips', () => {
            const req = mockReq({ url: '/viewtrips' });
            const res = mockRes();
            pageController.viewtrips(req, res);
            expect(res._redirectUrl).toBe('/app/trips');
        });
    });

    describe('tripDetails()', () => {
        it('should redirect to /app/trips/:id', () => {
            const req = mockReq({ params: { tripId: '42' } });
            const res = mockRes();
            pageController.tripDetails(req, res);
            expect(res._redirectUrl).toBe('/app/trips/42');
        });
    });
});
