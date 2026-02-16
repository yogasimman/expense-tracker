/**
 * Auth Controller Tests
 * Tests login, logout, session management, and index/dashboard pages
 */
const { cleanTestData, createTestUser, closePool } = require('../setup');
const bcrypt = require('bcrypt');
const User = require('../../models/userModel');

// Mock express req/res/next
function mockReq(overrides = {}) {
    return {
        body: {},
        params: {},
        cookies: {},
        url: '/',
        session: {
            isAuthenticated: false,
            user: null,
            destroy: (cb) => cb(null)
        },
        ...overrides
    };
}

function mockRes() {
    const res = {
        _status: 200,
        _redirectUrl: null,
        _rendered: null,
        _json: null,
        _cookies: {},
        _clearedCookies: [],
        status: function (code) { res._status = code; return res; },
        redirect: function (url) { res._redirectUrl = url; },
        render: function (view, data) { res._rendered = { view, data }; },
        json: function (data) { res._json = data; },
        send: function (data) { res._sent = data; },
        cookie: function (name, val, opts) { res._cookies[name] = val; },
        clearCookie: function (name) { res._clearedCookies.push(name); }
    };
    return res;
}

const authController = require('../../controllers/authController');

let testUser;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser({ role: 'submitter' });
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Auth Controller', () => {
    describe('loginPage()', () => {
        it('should redirect to /app/login if not authenticated', () => {
            const req = mockReq();
            const res = mockRes();
            authController.loginPage(req, res);
            expect(res._redirectUrl).toBe('/app/login');
        });

        it('should redirect to /app if already authenticated', () => {
            const req = mockReq({ session: { isAuthenticated: true } });
            const res = mockRes();
            authController.loginPage(req, res);
            expect(res._redirectUrl).toBe('/app');
        });
    });

    describe('login()', () => {
        it('should redirect if already authenticated', async () => {
            const req = mockReq({ session: { isAuthenticated: true } });
            const res = mockRes();
            await authController.login(req, res);
            expect(res._redirectUrl).toBe('/app');
        });
    });

    describe('logout()', () => {
        it('should destroy session and redirect to /app/login', () => {
            let sessionDestroyed = false;
            const req = mockReq({
                session: {
                    destroy: (cb) => { sessionDestroyed = true; cb(null); }
                }
            });
            const res = mockRes();
            authController.logout(req, res);
            expect(sessionDestroyed).toBe(true);
            expect(res._redirectUrl).toBe('/app/login');
            expect(res._clearedCookies).toContain('name');
            expect(res._clearedCookies).toContain('email');
            expect(res._clearedCookies).toContain('role');
        });

        it('should redirect to /app if session destroy fails', () => {
            const req = mockReq({
                session: {
                    destroy: (cb) => { cb(new Error('fail')); }
                }
            });
            const res = mockRes();
            authController.logout(req, res);
            expect(res._redirectUrl).toBe('/app');
        });
    });

    describe('dashboardPage()', () => {
        it('should redirect to /app', () => {
            const req = mockReq({ cookies: { name: 'TestUser' }, url: '/dashboard' });
            const res = mockRes();
            authController.dashboardPage(req, res);
            expect(res._redirectUrl).toBe('/app');
        });
    });

    describe('index()', () => {
        it('should redirect to /app/login if not authenticated', () => {
            const req = mockReq({ session: { isAuthenticated: false } });
            const res = mockRes();
            authController.index(req, res);
            expect(res._redirectUrl).toBe('/app/login');
        });

        it('should redirect to /app if authenticated', () => {
            const req = mockReq({
                url: '/',
                cookies: { name: 'TestUser', role: 'submitter' },
                session: {
                    isAuthenticated: true,
                    user: { id: testUser.id, role: 'submitter' }
                }
            });
            const res = mockRes();
            authController.index(req, res);
            expect(res._redirectUrl).toBe('/app');
        });
    });
});
