require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const ajaxRoutes = require('./routes/ajaxRoutes');
const analyticsRoutes = require('./routes/analytics')
const apiRoutes = require('./routes/apiRoutes');
const error404 = require('./middlewares/404Middleware');
const path = require('path');
const Trip = require('./models/tripModel');
const Expense = require('./models/expenseModel');
const multer = require('multer');
const app = express();
const crypto = require('crypto');
const { pool } = require('./config/database');

    // Test PostgreSQL connection
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('Error connecting to PostgreSQL:', err);
        } else {
            console.log('PostgreSQL connected successfully at:', res.rows[0].now);
        }
    });

    // Middleware
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.set('view engine', 'ejs');
    app.use(cookieParser());

    // Serve static files first
    app.use(express.static(path.join(__dirname, 'public')));

    // Session middleware
    app.use(session({
        store: new pgSession({
            pool: pool,
            tableName: 'sessions'
        }),
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
    }));

    // Routes
    app.use('/api', apiRoutes);
    app.use('/', authRoutes);
    app.use('/ajax', ajaxRoutes);
    app.use('/analytics', analyticsRoutes); // Use the analytics routes

    // Route to fetch trips for a selected user (only for admins)
    app.get('/trips/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const trips = await Trip.findByUserId(userId);
            // Return only trip ID and name
            const tripList = trips.map(t => ({ _id: t.id, id: t.id, tripName: t.tripName || t.trip_name }));
            res.json(tripList);
        } catch (error) {
            console.error('Error fetching trips:', error);
            res.status(500).send('Server Error');
        }
    });

// Configure multer for file storage in memory
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Handle the route for uploading receipts
app.post('/upload-receipts', upload.array('receipts', 5), async (req, res) => {
    try {
        const fileIds = [];
        
        // Note: This endpoint now just stores files temporarily in memory
        // The actual saving to database happens when the expense is created
        // We'll return file information that can be used later
        const filesInfo = req.files.map(file => ({
            filename: crypto.randomBytes(16).toString('hex') + path.extname(file.originalname),
            original_filename: file.originalname,
            content_type: file.mimetype,
            file_size: file.size,
            file_data: file.buffer
        }));
        
        res.json({ files: filesInfo });
    } catch (error) {
        console.error('Error uploading receipts:', error);
        res.status(500).json({ error: 'Failed to upload receipts' });
    }
});

// Route to display a specific receipt by file ID
app.get('/file/:fileId', async (req, res) => {
    try {
        const fileId = parseInt(req.params.fileId);
        const receipt = await Expense.getReceiptById(fileId);
        
        if (!receipt) {
            return res.status(404).json({ err: 'No file exists' });
        }

        // Set content type and send file
        res.set('Content-Type', receipt.content_type);
        res.set('Content-Disposition', `inline; filename="${receipt.original_filename}"`);
        res.send(receipt.file_data);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
});


    // Route to handle status update requests
    app.post('/update-status', async (req, res) => {
        try {
            const { id, status } = req.body;
    
            // Validate input
            if (!id || !status) {
                return res.status(400).json({ success: false, message: 'Invalid input' });
            }
    
            console.log("Updating status for ID:", id, "Status:", status);
    
            // Update the trip status
            const updatedTrip = await Trip.updateStatus(id, status);
    
            if (!updatedTrip) {
                return res.status(404).json({ success: false, message: 'Trip not found' });
            }
    
            res.json({ success: true, message: 'Status updated successfully', updatedTrip });
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    
    // Serve Vue.js frontend build (production)
    const vueBuildPath = path.join(__dirname, 'frontend', 'dist');
    if (require('fs').existsSync(vueBuildPath)) {
        app.use(express.static(vueBuildPath));
        // SPA fallback - serve index.html for any non-API routes
        app.get(/^\/app(\/.*)?$/, (req, res) => {
            res.sendFile(path.join(vueBuildPath, 'index.html'));
        });
    }

    // 404 error middleware
    app.use(error404);

    // Server start
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
