# MongoDB to PostgreSQL Migration Guide

## Overview
This expense tracker application has been successfully migrated from MongoDB to PostgreSQL. This document outlines the migration steps, database structure, and how to set up the system.

## Database Configuration

- **Host**: localhost
- **Port**: 5432 (default PostgreSQL port)
- **Database**: expense_tracker
- **Username**: postgres
- **Password**: postgres

## Migration Changes

### 1. Dependencies Updated
**Removed:**
- `mongoose` - MongoDB ODM
- `connect-mongo` - MongoDB session store
- `gridfs-stream` - MongoDB file storage
- `multer-gridfs-storage` - GridFS storage for Multer

**Added:**
- `pg` - PostgreSQL client
- `connect-pg-simple` - PostgreSQL session store

### 2. Database Schema

The PostgreSQL schema includes the following tables:

#### Core Tables:
- **users** - User authentication and profile information
- **categories** - Expense categories
- **trips** - Trip information
- **trip_users** - Many-to-many relationship between trips and users

#### Itinerary Tables (normalized from MongoDB nested structure):
- **flights** - Flight itinerary details
- **buses** - Bus itinerary details
- **trains** - Train itinerary details
- **cabs** - Cab itinerary details

#### Transaction Tables:
- **expenses** - Expense records
- **receipts** - Receipt files (replaces MongoDB GridFS)
- **advances** - Advance payments
- **reports** - Expense reports

#### System Tables:
- **sessions** - Express session storage

### 3. Key Design Improvements

1. **Normalization**: Complex nested MongoDB structures (like trip itinerary) are now properly normalized
2. **Referential Integrity**: Foreign key constraints ensure data consistency
3. **Cascading Deletes**: Automatic cleanup of related records
4. **Indexes**: Optimized queries with strategic indexes
5. **Triggers**: Automatic timestamp updates
6. **Constraints**: CHECK constraints for data validation

### 4. File Storage

MongoDB GridFS has been replaced with PostgreSQL BYTEA storage:
- Receipt files are stored in the `receipts` table
- Files are stored as binary data (BYTEA type)
- Includes metadata: filename, content type, file size

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Make sure PostgreSQL is installed and running on your system.

### 3. Create Database and Tables

Run the database setup script:

```bash
node database/setup.js
```

This script will:
- Create the `expense_tracker` database
- Create all tables with proper schema
- Add indexes and constraints
- Seed default categories
- Set up triggers for automatic timestamp updates

Alternatively, you can manually run the SQL script:

```bash
psql -U postgres -f database/schema.sql
```

### 4. Verify Database Setup

You can verify the setup by connecting to PostgreSQL:

```bash
psql -U postgres -d expense_tracker

# List all tables
\dt

# Check specific table structure
\d users
```

### 5. Start the Application

```bash
npm run run_dev
```

Or for production:

```bash
npm start
```

## Model API Changes

The model interfaces have been updated to use static methods instead of Mongoose methods:

### MongoDB → PostgreSQL Method Mapping

| MongoDB Mongoose | PostgreSQL Model |
|-----------------|------------------|
| `Model.find()` | `Model.findAll()` |
| `Model.findOne()` | `Model.findById()`, `Model.findByEmail()`, etc. |
| `Model.findById()` | `Model.findById()` |
| `new Model().save()` | `Model.create()` |
| `Model.findByIdAndUpdate()` | `Model.update()` |
| `Model.findByIdAndDelete()` | `Model.delete()` |
| `Model.aggregate()` | Custom query methods or AnalyticsHelper |

### Example Usage

**Before (MongoDB):**
```javascript
const user = await User.findOne({ email: 'test@example.com' });
const newUser = new User({ name: 'John', email: 'john@example.com' });
await newUser.save();
```

**After (PostgreSQL):**
```javascript
const user = await User.findByEmail('test@example.com');
const newUser = await User.create({ name: 'John', email: 'john@example.com' });
```

## Analytics Changes

MongoDB aggregation pipelines have been replaced with PostgreSQL queries in the `AnalyticsHelper` class:

```javascript
const AnalyticsHelper = require('./controllers/analyticsHelper');

// Get user expenses by category
const expenses = await AnalyticsHelper.getUserExpensesByCategory(userId);

// Get overall analytics (admin)
const overallExpenses = await AnalyticsHelper.getOverallExpensesByCategory();
```

## File Structure

```
expense-tracker/
├── config/
│   └── database.js          # PostgreSQL connection pool
├── database/
│   ├── schema.sql           # Complete database schema
│   └── setup.js             # Database setup script
├── models/
│   ├── userModel.js         # User model (PostgreSQL)
│   ├── categoryModel.js     # Category model (PostgreSQL)
│   ├── tripModel.js         # Trip model (PostgreSQL)
│   ├── expenseModel.js      # Expense model (PostgreSQL)
│   ├── advancesModel.js     # Advance model (PostgreSQL)
│   └── reportsModel.js      # Report model (PostgreSQL)
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── ajaxController.js    # AJAX endpoints
│   ├── pageController.js    # Page rendering
│   └── analyticsHelper.js   # Analytics aggregations
└── app.js                   # Main application file
```

## Database Backup and Restore

### Backup
```bash
pg_dump -U postgres -d expense_tracker -F c -b -v -f expense_tracker_backup.dump
```

### Restore
```bash
pg_restore -U postgres -d expense_tracker -v expense_tracker_backup.dump
```

## Troubleshooting

### Connection Issues
If you can't connect to PostgreSQL:
1. Verify PostgreSQL is running: `pg_isready`
2. Check configuration in `config/database.js`
3. Ensure user has proper permissions

### Missing Tables
If tables are missing:
```bash
node database/setup.js
```

### Permission Errors
Grant necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Connection Pooling**: Using pg Pool for efficient connection management
3. **Prepared Statements**: Parameterized queries prevent SQL injection and improve performance
4. **Transactions**: Complex operations use transactions for atomicity

## Security Improvements

1. **SQL Injection Prevention**: All queries use parameterized statements
2. **Foreign Key Constraints**: Prevent orphaned records
3. **Check Constraints**: Validate data at database level
4. **Password Storage**: Continues to use bcrypt hashing

## Migration Notes

### Session Storage
- MongoDB session store (`connect-mongo`) replaced with PostgreSQL (`connect-pg-simple`)
- Sessions are now stored in the `sessions` table
- Session expiry handled by PostgreSQL

### File Uploads
- GridFS replaced with BYTEA storage
- Files stored directly in `receipts` table
- File size limit: 10MB (configurable in app.js)

### ID Fields
- MongoDB ObjectId replaced with PostgreSQL SERIAL (auto-incrementing integer)
- All references updated from `_id` to `id`
- Frontend may need updates if it expects ObjectId format

## Next Steps

1. Test all features thoroughly
2. Update any frontend code that relies on MongoDB-specific features
3. Consider implementing database migrations for future schema changes
4. Set up automated backups
5. Configure database monitoring

## Support

For issues or questions about the migration:
1. Check the error logs in the console
2. Verify database connection and credentials
3. Ensure all tables are properly created
4. Check that PostgreSQL version is 12 or higher

## License

Same as the original project.
