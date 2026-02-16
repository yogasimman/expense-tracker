/**
 * Middleware Tests
 * Tests authMiddleware and 404Middleware
 */
const path = require('path');

describe('Auth Middleware', () => {
    const authMiddleware = require('../../middlewares/authMiddleware');

    function mockReq(overrides = {}) {
        return {
            session: { isAuthenticated: false },
            ...overrides
        };
    }

    function mockRes() {
        const res = {
            _redirectUrl: null,
            redirect: function (url) { res._redirectUrl = url; }
        };
        return res;
    }

    it('should call next() if user is authenticated', () => {
        const req = mockReq({ session: { isAuthenticated: true } });
        const res = mockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authMiddleware(req, res, next);
        expect(nextCalled).toBe(true);
        expect(res._redirectUrl).toBeNull();
    });

    it('should redirect to /app/login if not authenticated', () => {
        const req = mockReq({ session: { isAuthenticated: false }, originalUrl: '/dashboard' });
        const res = mockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authMiddleware(req, res, next);
        expect(nextCalled).toBe(false);
        expect(res._redirectUrl).toBe('/app/login');
    });

    it('should redirect to /app/login if session is undefined', () => {
        const req = { session: {}, originalUrl: '/trips' };
        const res = mockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        authMiddleware(req, res, next);
        expect(nextCalled).toBe(false);
        expect(res._redirectUrl).toBe('/app/login');
    });
});

describe('404 Middleware', () => {
    const error404 = require('../../middlewares/404Middleware');

    it('should send 404 status with file', () => {
        const req = {};
        const res = {
            _status: null,
            _sentFile: null,
            status: function (code) { res._status = code; return res; },
            sendFile: function (filePath) { res._sentFile = filePath; }
        };

        error404(req, res);
        expect(res._status).toBe(404);
        expect(res._sentFile).toContain('404.html');
    });
});
