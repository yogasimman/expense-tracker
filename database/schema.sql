-- ===================================================================
-- Expense Tracker PostgreSQL Database Schema
-- Database: expense_tracker
-- User: postgres
-- Password: postgres
-- ===================================================================

-- Drop existing tables if they exist (cascade to remove dependencies)
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS advances CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS trains CASCADE;
DROP TABLE IF EXISTS cabs CASCADE;
DROP TABLE IF EXISTS trip_users CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ===================================================================
-- Users Table
-- Stores user authentication and profile information
-- ===================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL,
    department VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'submitter' CHECK (role IN ('submitter', 'approver', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Categories Table
-- Stores expense categories (e.g., meals, transportation)
-- ===================================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Trips Table
-- Stores trip information with status tracking
-- ===================================================================
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    trip_name VARCHAR(255) NOT NULL,
    travel_type VARCHAR(50) NOT NULL CHECK (travel_type IN ('local', 'domestic', 'international')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Trip Users Junction Table
-- Many-to-many relationship between trips and users
-- ===================================================================
CREATE TABLE trip_users (
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Flights Table
-- Stores flight itinerary details for trips
-- ===================================================================
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    depart_from VARCHAR(255),
    arrive_at VARCHAR(255),
    departure_date TIMESTAMP,
    return_date TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Buses Table
-- Stores bus itinerary details for trips
-- ===================================================================
CREATE TABLE buses (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    depart_from VARCHAR(255),
    arrive_at VARCHAR(255),
    departure_date TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Trains Table
-- Stores train itinerary details for trips
-- ===================================================================
CREATE TABLE trains (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    depart_from VARCHAR(255),
    arrive_at VARCHAR(255),
    departure_date TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Cabs Table
-- Stores cab itinerary details for trips
-- ===================================================================
CREATE TABLE cabs (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    pick_up_location VARCHAR(255),
    drop_off_location VARCHAR(255),
    pick_up_date TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Expenses Table
-- Stores expense records linked to users, trips, and categories
-- ===================================================================
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    expense_title VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('INR', 'USD')),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Receipts Table
-- Stores receipt files for expenses (replaces MongoDB GridFS)
-- ===================================================================
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_data BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Advances Table
-- Stores advance payments for trips
-- ===================================================================
CREATE TABLE advances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('INR', 'USD')),
    paid_through VARCHAR(100) NOT NULL,
    reference_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Reports Table
-- Stores expense reports for trip submissions
-- ===================================================================
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    business_purpose TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    rejection_reason TEXT,
    approval_message TEXT,
    reimbursement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ===================================================================
-- Sessions Table
-- Stores Express session data for connect-pg-simple
-- ===================================================================
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- ===================================================================
-- Indexes for Performance Optimization
-- ===================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);

-- Trips indexes
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_travel_type ON trips(travel_type);
CREATE INDEX idx_trips_created_at ON trips(created_at);

-- Trip Users indexes
CREATE INDEX idx_trip_users_user_id ON trip_users(user_id);
CREATE INDEX idx_trip_users_trip_id ON trip_users(trip_id);

-- Expenses indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);

-- Receipts indexes
CREATE INDEX idx_receipts_expense_id ON receipts(expense_id);

-- Advances indexes
CREATE INDEX idx_advances_user_id ON advances(user_id);
CREATE INDEX idx_advances_trip_id ON advances(trip_id);

-- Reports indexes
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_trip_id ON reports(trip_id);
CREATE INDEX idx_reports_status ON reports(status);

-- Itinerary indexes
CREATE INDEX idx_flights_trip_id ON flights(trip_id);
CREATE INDEX idx_buses_trip_id ON buses(trip_id);
CREATE INDEX idx_trains_trip_id ON trains(trip_id);
CREATE INDEX idx_cabs_trip_id ON cabs(trip_id);

-- Sessions index
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- ===================================================================
-- Functions and Triggers for Updated_At Timestamp
-- ===================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flights_updated_at BEFORE UPDATE ON flights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON buses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trains_updated_at BEFORE UPDATE ON trains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cabs_updated_at BEFORE UPDATE ON cabs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advances_updated_at BEFORE UPDATE ON advances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- Default Categories Seed Data
-- ===================================================================
INSERT INTO categories (name, description) VALUES
('Travel', 'Transportation and travel expenses'),
('Meals', 'Food and dining expenses'),
('Accommodation', 'Hotel and lodging expenses'),
('Entertainment', 'Client entertainment and business meals'),
('Communication', 'Phone, internet, and communication expenses'),
('Supplies', 'Office supplies and materials'),
('Fuel', 'Vehicle fuel expenses'),
('Parking', 'Parking and toll fees'),
('Other', 'Miscellaneous expenses');

-- ===================================================================
-- Database Setup Complete
-- ===================================================================
