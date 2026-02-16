/**
 * API Routes - RESTful JSON API for Vue.js frontend
 */
const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Advance = require('../models/advancesModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const bcrypt = require('bcrypt');

// ─── AUTH ──────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        req.session.isAuthenticated = true;
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            designation: user.designation,
            employee_id: user.employee_id,
            mobile: user.mobile
        };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

router.get('/auth/me', isAuthenticated, (req, res) => {
    res.json({ user: req.session.user });
});

// ─── USERS ─────────────────────────────────────────────
router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const users = await User.findAll();
        const sanitized = users.map(u => ({
            id: u.id, name: u.name, email: u.email, role: u.role,
            department: u.department, designation: u.designation,
            employee_id: u.employee_id, mobile: u.mobile
        }));
        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.post('/users', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const { name, email, password, employee_id, mobile, department, designation, role } = req.body;
        if (!password) return res.status(400).json({ message: 'Password is required' });

        const existing = await User.findByEmail(email);
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name, email, password: hashedPassword,
            employee_id, mobile, department, designation, role
        });
        res.json({ success: true, message: 'User added successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (req.session.user.role !== 'admin' && req.session.user.id !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        const updated = await User.update(userId, updateData);
        if (!updated) return res.status(404).json({ message: 'User not found' });
        // Update session if editing own profile
        if (req.session.user.id === userId) {
            Object.assign(req.session.user, {
                name: updated.name || req.session.user.name,
                email: updated.email || req.session.user.email,
                department: updated.department || req.session.user.department,
                designation: updated.designation || req.session.user.designation,
                mobile: updated.mobile || req.session.user.mobile
            });
        }
        res.json({ success: true, user: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

// ─── TRIPS ─────────────────────────────────────────────
router.get('/trips', isAuthenticated, async (req, res) => {
    try {
        const { status, userId } = req.query;
        const filters = {};
        if (status) filters.status = status;
        // Admin can see all trips, user sees only their own
        if (req.session.user.role !== 'admin') {
            filters.userId = req.session.user.id;
        } else if (userId) {
            filters.userId = parseInt(userId);
        }
        const trips = await Trip.findAll(filters);
        res.json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Error fetching trips' });
    }
});

router.get('/trips/:id', isAuthenticated, async (req, res) => {
    try {
        const trip = await Trip.findById(parseInt(req.params.id));
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        // Get expenses/advances for this trip
        const expenses = await Expense.findAll({ tripId: trip.id });
        const advances = await Advance.findAll({ tripId: trip.id });
        res.json({ trip, expenses, advances });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trip details' });
    }
});

router.post('/trips', isAuthenticated, async (req, res) => {
    try {
        const { tripName, travelType, itinerary } = req.body;
        let userId = req.body.userId || req.session.user.id;
        if (typeof userId === 'string') userId = parseInt(userId);
        if (!Array.isArray(userId)) userId = [userId];

        const trip = await Trip.create({ tripName, travelType, userId, itinerary, status: 'pending' });
        res.json({ success: true, message: 'Trip created successfully', trip });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/trips/:id', isAuthenticated, async (req, res) => {
    try {
        const trip = await Trip.findById(parseInt(req.params.id));
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'pending' && req.session.user.role !== 'admin') {
            return res.status(400).json({ message: 'Can only delete pending trips' });
        }
        await Trip.delete(parseInt(req.params.id));
        res.json({ success: true, message: 'Trip deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting trip' });
    }
});

router.post('/trips/:id/status', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const { status } = req.body;
        const updated = await Trip.updateStatus(parseInt(req.params.id), status);
        if (!updated) return res.status(404).json({ message: 'Trip not found' });
        res.json({ success: true, trip: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error updating trip status' });
    }
});

router.post('/trips/:id/finish', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const trip = await Trip.findById(parseInt(req.params.id));
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'approved') {
            return res.status(400).json({ message: 'Only approved trips can be finished' });
        }
        const updated = await Trip.updateStatus(parseInt(req.params.id), 'finished');
        res.json({ success: true, trip: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error finishing trip' });
    }
});

// ─── EXPENSES ──────────────────────────────────────────
router.get('/expenses', isAuthenticated, async (req, res) => {
    try {
        const { status, tripId } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (tripId) filters.tripId = parseInt(tripId);
        if (req.session.user.role !== 'admin') {
            filters.userId = req.session.user.id;
        }
        const expenses = await Expense.findAll(filters);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

router.post('/expenses', isAuthenticated, async (req, res) => {
    try {
        const { expenseTitle, amount, currency, date, categoryId, tripId, description, receipts } = req.body;
        let userId = req.body.userId || req.session.user.id;

        // Validate trip status
        const trip = await Trip.findById(parseInt(tripId));
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'approved') {
            return res.status(400).json({ message: 'Expenses can only be added to approved trips' });
        }
        if (trip.status === 'finished') {
            return res.status(400).json({ message: 'This trip is finished. No more expenses can be added.' });
        }

        const expense = await Expense.create({
            userId, tripId: parseInt(tripId), categoryId: parseInt(categoryId),
            expenseTitle, amount: parseFloat(amount), currency, description, date,
            receipts: receipts || []
        });
        res.json({ success: true, message: 'Expense added successfully', expense });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/expenses/:id', isAuthenticated, async (req, res) => {
    try {
        const expense = await Expense.findById(parseInt(req.params.id));
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        // Only allow delete if pending & (owner or admin)
        if (expense.status !== 'pending') {
            return res.status(400).json({ message: 'Can only delete pending expenses' });
        }
        if (expense.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Expense.delete(parseInt(req.params.id));
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense' });
    }
});

router.post('/expenses/approve', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { expenseIds } = req.body;
        if (!expenseIds?.length) return res.status(400).json({ message: 'No expenses selected' });
        const approved = await Expense.approveMultiple(expenseIds, req.session.user.id);
        res.json({ success: true, message: `${approved.length} expense(s) approved`, expenses: approved });
    } catch (error) {
        res.status(500).json({ message: 'Error approving expenses' });
    }
});

router.post('/expenses/:id/reject', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { rejectionReason } = req.body;
        if (!rejectionReason?.trim()) return res.status(400).json({ message: 'Rejection reason required' });
        const rejected = await Expense.reject(parseInt(req.params.id), req.session.user.id, rejectionReason);
        res.json({ success: true, expense: rejected });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting expense' });
    }
});

// ─── ADVANCES ──────────────────────────────────────────
router.get('/advances', isAuthenticated, async (req, res) => {
    try {
        const { status, tripId } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (tripId) filters.tripId = parseInt(tripId);
        if (req.session.user.role !== 'admin') {
            filters.userId = req.session.user.id;
        }
        const advances = await Advance.findAll(filters);
        res.json(advances);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching advances' });
    }
});

router.post('/advances', isAuthenticated, async (req, res) => {
    try {
        const { amount, currency, paidThrough, referenceId, notes, tripId } = req.body;
        let userId = req.body.userId || req.session.user.id;

        const trip = await Trip.findById(parseInt(tripId));
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'approved') {
            return res.status(400).json({ message: 'Advances can only be added to approved trips' });
        }

        const advance = await Advance.create({
            user_id: parseInt(userId), trip_id: parseInt(tripId),
            amount: parseFloat(amount), currency,
            paid_through: paidThrough, reference_id: referenceId, notes
        });
        res.json({ success: true, message: 'Advance added successfully', advance });
    } catch (error) {
        console.error('Error creating advance:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/advances/:id', isAuthenticated, async (req, res) => {
    try {
        const advance = await Advance.findById(parseInt(req.params.id));
        if (!advance) return res.status(404).json({ message: 'Advance not found' });
        if (advance.status !== 'pending') {
            return res.status(400).json({ message: 'Can only delete pending advances' });
        }
        if (advance.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Advance.delete(parseInt(req.params.id));
        res.json({ success: true, message: 'Advance deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting advance' });
    }
});

router.post('/advances/approve', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { advanceIds } = req.body;
        if (!advanceIds?.length) return res.status(400).json({ message: 'No advances selected' });
        const approved = await Advance.approveMultiple(advanceIds, req.session.user.id);
        res.json({ success: true, message: `${approved.length} advance(s) approved`, advances: approved });
    } catch (error) {
        res.status(500).json({ message: 'Error approving advances' });
    }
});

router.post('/advances/:id/reject', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { rejectionReason } = req.body;
        if (!rejectionReason?.trim()) return res.status(400).json({ message: 'Rejection reason required' });
        const rejected = await Advance.reject(parseInt(req.params.id), req.session.user.id, rejectionReason);
        res.json({ success: true, advance: rejected });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting advance' });
    }
});

// ─── CATEGORIES ────────────────────────────────────────
router.get('/categories', isAuthenticated, async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

router.post('/categories', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        const { name } = req.body;
        const category = await Category.create({ name });
        res.json({ success: true, category });
    } catch (error) {
        res.status(500).json({ message: 'Error creating category' });
    }
});

router.delete('/categories/:id', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
        await Category.delete(parseInt(req.params.id));
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// ─── REPORTS ───────────────────────────────────────────
router.get('/reports', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (req.session.user.role !== 'admin') {
            filters.userId = req.session.user.id;
        }
        const reports = await Reports.findAll(filters);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports' });
    }
});

router.post('/reports', isAuthenticated, async (req, res) => {
    try {
        const { reportName, businessPurpose, tripId, fromDate, toDate } = req.body;
        const userId = req.body.userId || req.session.user.id;
        const report = await Reports.create({
            user_id: parseInt(userId), trip_id: parseInt(tripId),
            report_name: reportName, business_purpose: businessPurpose,
            from_date: fromDate, to_date: toDate
        });
        res.json({ success: true, message: 'Report created successfully', report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── DASHBOARD ─────────────────────────────────────────
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const isAdmin = req.session.user.role === 'admin';

        const [trips, expenses, advances, reports] = await Promise.all([
            Trip.findAll(isAdmin ? {} : { userId }),
            Expense.findAll(isAdmin ? {} : { userId }),
            Advance.findAll(isAdmin ? {} : { userId }),
            Reports.findAll(isAdmin ? {} : { userId })
        ]);

        const pendingTrips = trips.filter(t => t.status === 'pending').length;
        const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
        const pendingAdvances = advances.filter(a => a.status === 'pending').length;
        const totalExpenseAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const totalAdvanceAmount = advances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

        res.json({
            stats: {
                totalTrips: trips.length,
                pendingTrips,
                totalExpenses: expenses.length,
                pendingExpenses,
                totalAdvances: advances.length,
                pendingAdvances,
                totalExpenseAmount,
                totalAdvanceAmount,
                totalReports: reports.length
            },
            recentTrips: trips.slice(0, 5),
            recentExpenses: expenses.slice(0, 5)
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

module.exports = router;
