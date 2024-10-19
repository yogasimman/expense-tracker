const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const ajaxRoutes = require('./routes/ajaxRoutes');
const analyticsRoutes = require('./routes/analytics')
const error404 = require('./middlewares/404Middleware');
const path = require('path');
const Trip = require('./models/tripModel');
const multer = require('multer');
const Grid = require('gridfs-stream');
const app = express();
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');


    // MongoDB Atlas connection
    const mongoURI = 'mongodb://localhost:27017/express-tracker';
    mongoose.connect(mongoURI,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    
    })
    .then(() => {
        console.log('MongoDB connected');
        initGridFS();  // Initialize GridFS after connection is established
    })
        .catch(err => console.log(err));

    // Middleware
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.set('view engine', 'ejs');
    app.use(cookieParser());

    // Serve static files first
    app.use(express.static(path.join(__dirname, 'public')));

    // Session middleware
    app.use(session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/express-tracker' }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
    }));

    // Routes
    app.use('/', authRoutes);
    app.use('/ajax', ajaxRoutes);
    app.use('/analytics', analyticsRoutes); // Use the analytics routes

    // Route to fetch trips for a selected user (only for admins)
    app.get('/trips/:userId', async (req, res) => {
        try {   
            const userId = req.params.userId; // Get user ID from the URL
            const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch trips for the selected user
            res.json(trips); // Send trips as JSON response
        } catch (error) {
            console.error('Error fetching trips:', error);
            res.status(500).send('Server Error');
        }
    });

    let gfs;
let conn = mongoose.connection;

function initGridFS() {
    conn.once('open', () => {
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection('receipts'); // Set the collection for GridFS
        console.log('GridFS initialized');
    });
}

// Create storage engine for GridFS
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'receipts'  // The collection in MongoDB where the files will be stored
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });

// Handle the route for uploading files
app.post('/upload-receipts', upload.array('receipts', 5), (req, res) => {
    const fileIds = req.files.map(file => file.id);  // Extract the ObjectIds of the uploaded files
    res.json({ fileIds });  // Send back the file ids to reference them in the expense record
});

// Route to display a specific receipt by file ID
app.get('/file/:fileId', (req, res) => {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    gfs.files.findOne({ _id: fileId }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({ err: 'No file exists' });
        }

        // Check if file is an image
        if (file.contentType.startsWith('image/')) {
            // Stream the image file
            const readstream = gfs.createReadStream(file._id);
            readstream.pipe(res);
        } else {
            // Handle other file types (PDF, DOC, etc.)
            res.set('Content-Type', file.contentType);
            const readstream = gfs.createReadStream(file._id);
            readstream.pipe(res);
        }
    });
});


    // Route to handle status update requests
    app.post('/update-status', async (req, res) => {
        try {
            const { id, status } = req.body;
    
            // Validate input
            if (!id || !status) {
                return res.status(400).json({ success: false, message: 'Invalid input' });
            }
    
            console.log("Updating status for ID:", id, "Status:", status); // Log incoming values
    
            // Update the trip status
            const updatedTrip = await Trip.findByIdAndUpdate(
                id,
                { status: status },
                { new: true, runValidators: true }
            );
    
            if (!updatedTrip) {
                return res.status(404).json({ success: false, message: 'Trip not found' });
            }
    
            res.json({ success: true, message: 'Status updated successfully', updatedTrip });
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
    
    // 404 error middleware
    app.use(error404);

    // Server start
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
