/**
 * Page Controller Tests
 * Tests page rendering functions (settings, expenses, trips, advances, approvals, etc.)
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
        _rendered: null,
        _redirectUrl: null,
        _sent: null,
        status: function (code) { res._status = code; return res; },
        json: function (data) { res._json = data; return res; },
        render: function (view, data) { res._rendered = { view, data }; },
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
        it('should render settings page with user data', async () => {
            const req = mockReq({
                url: '/settings',
                session: { user: { id: testUser.id } }
            });
            const res = mockRes();
            await pageController.settings(req, res);
            expect(res._rendered.view).toBe('settings');
            expect(res._rendered.data.email).toBe(testUser.email);
            expect(res._rendered.data.name).toBeDefined();
        });

        it('should redirect to /login if user not found', async () => {
            const req = mockReq({
                session: { user: { id: 999999 } }
            });
            const res = mockRes();
            await pageController.settings(req, res);
            expect(res._redirectUrl).toBe('/login');
        });
    });

    describe('expenses()', () => {
        it('should render expenses page with trips for submitter', async () => {
            const req = mockReq({
                url: '/expenses',
                session: { user: { id: testUser.id, role: 'submitter' } }
            });
            const res = mockRes();
            await pageController.expenses(req, res);
            expect(res._rendered.view).toBe('expenses');
            expect(Array.isArray(res._rendered.data.trips)).toBe(true);
            expect(res._rendered.data.role).toBe('submitter');
            expect(res._rendered.data.users).toEqual([]);
        });

        it('should include users list for admin', async () => {
            const req = mockReq({
                url: '/expenses',
                session: { user: { id: testAdminUser.id, role: 'admin' } }
            });
            const res = mockRes();
            await pageController.expenses(req, res);
            expect(res._rendered.view).toBe('expenses');
            expect(res._rendered.data.users.length).toBeGreaterThan(0);
        });
    });

    describe('trips()', () => {
        it('should render trips page', () => {
            const req = mockReq({
                url: '/trips',
                session: { user: { role: 'submitter' } }
            });
            const res = mockRes();
            pageController.trips(req, res);
            expect(res._rendered.view).toBe('trips');
            expect(res._rendered.data.role).toBe('submitter');
        });
    });

    describe('advances()', () => {
        it('should render advances page with trips', async () => {
            const req = mockReq({
                url: '/advances',
                session: { user: { id: testUser.id, role: 'submitter' } }
            });
            const res = mockRes();
            await pageController.advances(req, res);
            expect(res._rendered.view).toBe('advances');
            expect(Array.isArray(res._rendered.data.trips)).toBe(true);
        });
    });

    describe('approvals()', () => {
        it('should render approvals page with pending items', async () => {
            const req = mockReq({
                url: '/approvals',
                session: { user: { role: 'admin' } }
            });
            const res = mockRes();
            await pageController.approvals(req, res);
            expect(res._rendered.view).toBe('approvals');
            expect(res._rendered.data.pendingTrips).toBeDefined();
            expect(res._rendered.data.pendingReports).toBeDefined();
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

    describe('addReports()', () => {
        it('should render addReport page', async () => {
            const req = mockReq({
                url: '/reports',
                session: { user: { id: testUser.id, role: 'submitter' } }
            });
            const res = mockRes();
            await pageController.addReports(req, res);
            expect(res._rendered.view).toBe('addReport');
            expect(Array.isArray(res._rendered.data.trips)).toBe(true);
        });
    });

    describe('viewtrips()', () => {
        it('should render viewtrips page with trips', async () => {
            const req = mockReq({
                url: '/viewtrips',
                session: { user: { id: testUser.id, role: 'submitter', name: 'Test' } }
            });
            const res = mockRes();
            await pageController.viewtrips(req, res);
            expect(res._rendered.view).toBe('viewtrips');
            expect(Array.isArray(res._rendered.data.trips)).toBe(true);
        });
    });

    describe('viewreports()', () => {
        it('should render viewreports page', async () => {
            const req = mockReq({
                url: '/viewreports',
                session: { user: { id: testUser.id, role: 'submitter', name: 'Test' } }
            });
            const res = mockRes();
            await pageController.viewreports(req, res);
            expect(res._rendered.view).toBe('viewreports');
            expect(Array.isArray(res._rendered.data.reports)).toBe(true);
        });
    });
});
