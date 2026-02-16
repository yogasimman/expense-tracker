module.exports = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    } else {
        // Return JSON 401 for API requests, redirect for page requests
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        res.redirect('/login');
    }
};
