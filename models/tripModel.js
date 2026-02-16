/**
 * Trip Model
 * Handles all trip-related database operations including itinerary management
 */

const { query, transaction, getClient } = require('../config/database');

class Trip {
    /**
     * Create a new trip with itinerary
     */
    static async create(tripData) {
        return await transaction(async (client) => {
            const { tripName, travelType, status, userId, itinerary } = tripData;
            
            // Validate required fields
            if (!tripName || tripName.trim() === '') {
                throw new Error('Trip name is required');
            }
            if (!travelType) {
                throw new Error('Travel type is required');
            }
            
            // Insert trip
            const tripSql = `
                INSERT INTO trips (trip_name, travel_type, status)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const tripResult = await client.query(tripSql, [tripName.trim(), travelType, status || 'pending']);
            const trip = tripResult.rows[0];
            
            // Add trip users (support array of user IDs)
            const userIds = Array.isArray(userId) ? userId : [userId];
            for (const uid of userIds) {
                await client.query(
                    'INSERT INTO trip_users (trip_id, user_id) VALUES ($1, $2)',
                    [trip.id, uid]
                );
            }
            
            // Add itinerary items
            if (itinerary) {
                await this._addItinerary(client, trip.id, itinerary);
            }
            
            return await this._getTripWithDetails(client, trip.id);
        });
    }

    /**
     * Find trip by ID with all details
     */
    static async findById(id) {
        const client = await getClient();
        try {
            return await this._getTripWithDetails(client, id);
        } finally {
            client.release();
        }
    }

    /**
     * Get all trips with optional filters
     */
    static async findAll(filters = {}) {
        let sql = `
            SELECT DISTINCT t.*, 
                   array_agg(DISTINCT tu.user_id) as user_ids,
                   string_agg(DISTINCT u.name, ', ') as user_name
            FROM trips t
            LEFT JOIN trip_users tu ON t.id = tu.trip_id
            LEFT JOIN users u ON tu.user_id = u.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.userId) {
            sql += ` AND tu.user_id = $${paramCount}`;
            values.push(filters.userId);
            paramCount++;
        }

        if (filters.status) {
            sql += ` AND t.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        if (filters.travelType) {
            sql += ` AND t.travel_type = $${paramCount}`;
            values.push(filters.travelType);
            paramCount++;
        }

        sql += ' GROUP BY t.id ORDER BY t.created_at DESC';

        const result = await query(sql, values);
        
        // Get itinerary for each trip
        const trips = [];
        for (const trip of result.rows) {
            const detailsClient = await getClient();
            try {
                const fullTrip = await this._getTripWithDetails(detailsClient, trip.id);
                trips.push(fullTrip);
            } finally {
                detailsClient.release();
            }
        }
        
        return trips;
    }

    /**
     * Update trip
     */
    static async update(id, tripData) {
        return await transaction(async (client) => {
            const { tripName, travelType, status, userId, itinerary } = tripData;
            
            // Update trip basic info
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (tripName !== undefined) {
                fields.push(`trip_name = $${paramCount}`);
                values.push(tripName);
                paramCount++;
            }
            if (travelType !== undefined) {
                fields.push(`travel_type = $${paramCount}`);
                values.push(travelType);
                paramCount++;
            }
            if (status !== undefined) {
                fields.push(`status = $${paramCount}`);
                values.push(status);
                paramCount++;
            }

            if (fields.length > 0) {
                values.push(id);
                const sql = `
                    UPDATE trips 
                    SET ${fields.join(', ')}
                    WHERE id = $${paramCount}
                    RETURNING *
                `;
                await client.query(sql, values);
            }

            // Update trip users if provided
            if (userId !== undefined) {
                await client.query('DELETE FROM trip_users WHERE trip_id = $1', [id]);
                const userIds = Array.isArray(userId) ? userId : [userId];
                for (const uid of userIds) {
                    await client.query(
                        'INSERT INTO trip_users (trip_id, user_id) VALUES ($1, $2)',
                        [id, uid]
                    );
                }
            }

            // Update itinerary if provided
            if (itinerary !== undefined) {
                // Delete existing itinerary
                await client.query('DELETE FROM flights WHERE trip_id = $1', [id]);
                await client.query('DELETE FROM buses WHERE trip_id = $1', [id]);
                await client.query('DELETE FROM trains WHERE trip_id = $1', [id]);
                await client.query('DELETE FROM cabs WHERE trip_id = $1', [id]);
                
                // Add new itinerary
                await this._addItinerary(client, id, itinerary);
            }

            return await this._getTripWithDetails(client, id);
        });
    }

    /**
     * Delete trip
     */
    static async delete(id) {
        // Check if trip is approved
        const trip = await this.findById(id);
        if (!trip) {
            throw new Error('Trip not found');
        }
        if (trip.status === 'approved') {
            throw new Error('Cannot delete an approved trip');
        }

        // PostgreSQL CASCADE will handle related deletions
        const sql = 'DELETE FROM trips WHERE id = $1 RETURNING *';
        const result = await query(sql, [id]);
        return result.rows[0];
    }

    /**
     * Find trips by user ID
     */
    static async findByUserId(userId) {
        return await this.findAll({ userId });
    }

    /**
     * Update trip status
     */
    static async updateStatus(id, status) {
        const sql = `
            UPDATE trips 
            SET status = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await query(sql, [status, id]);
        return result.rows[0];
    }

    /**
     * Get trip statistics
     */
    static async getStatistics(tripId) {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM expenses WHERE trip_id = $1) as total_expenses,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = $1) as total_expense_amount,
                (SELECT COUNT(*) FROM advances WHERE trip_id = $1) as total_advances,
                (SELECT COALESCE(SUM(amount), 0) FROM advances WHERE trip_id = $1) as total_advance_amount,
                (SELECT COUNT(*) FROM reports WHERE trip_id = $1) as total_reports
        `;
        const result = await query(sql, [tripId]);
        return result.rows[0];
    }

    // Helper methods

    /**
     * Get trip with all details (itinerary, users, etc.)
     */
    static async _getTripWithDetails(client, tripId) {
        // Get basic trip info
        const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        if (tripResult.rows.length === 0) return null;
        
        const rawTrip = tripResult.rows[0];
        
        // Format trip data to camelCase for frontend compatibility
        const trip = {
            id: rawTrip.id,
            tripName: rawTrip.trip_name,
            travelType: rawTrip.travel_type,
            status: rawTrip.status,
            created_at: rawTrip.created_at,
            updated_at: rawTrip.updated_at,
            // Keep both formats for compatibility
            trip_name: rawTrip.trip_name,
            travel_type: rawTrip.travel_type
        };
        
        // Get user IDs
        const userResult = await client.query('SELECT user_id FROM trip_users WHERE trip_id = $1', [tripId]);
        trip.userId = userResult.rows.map(row => row.user_id);
        
        // Get itinerary
        const itinerary = {};
        
        const flightsResult = await client.query('SELECT * FROM flights WHERE trip_id = $1', [tripId]);
        itinerary.flights = flightsResult.rows.map(f => ({
            id: f.id,
            departFrom: f.depart_from,
            arriveAt: f.arrive_at,
            departureDate: f.departure_date,
            returnDate: f.return_date,
            description: f.description
        }));
        
        const busesResult = await client.query('SELECT * FROM buses WHERE trip_id = $1', [tripId]);
        itinerary.buses = busesResult.rows.map(b => ({
            id: b.id,
            departFrom: b.depart_from,
            arriveAt: b.arrive_at,
            departureDate: b.departure_date,
            description: b.description
        }));
        
        const trainsResult = await client.query('SELECT * FROM trains WHERE trip_id = $1', [tripId]);
        itinerary.trains = trainsResult.rows.map(t => ({
            id: t.id,
            departFrom: t.depart_from,
            arriveAt: t.arrive_at,
            departureDate: t.departure_date,
            description: t.description
        }));
        
        const cabsResult = await client.query('SELECT * FROM cabs WHERE trip_id = $1', [tripId]);
        itinerary.cabs = cabsResult.rows.map(c => ({
            id: c.id,
            pickUpLocation: c.pick_up_location,
            dropOffLocation: c.drop_off_location,
            pickUpDate: c.pick_up_date,
            description: c.description
        }));
        
        trip.itinerary = itinerary;
        
        return trip;
    }

    /**
     * Add itinerary items to a trip
     */
    static async _addItinerary(client, tripId, itinerary) {
        // Add flights
        if (itinerary.flights && itinerary.flights.length > 0) {
            for (const flight of itinerary.flights) {
                await client.query(
                    `INSERT INTO flights (trip_id, depart_from, arrive_at, departure_date, return_date, description)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [tripId, flight.departFrom, flight.arriveAt, flight.departureDate, flight.returnDate, flight.description]
                );
            }
        }
        
        // Add buses
        if (itinerary.buses && itinerary.buses.length > 0) {
            for (const bus of itinerary.buses) {
                await client.query(
                    `INSERT INTO buses (trip_id, depart_from, arrive_at, departure_date, description)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [tripId, bus.departFrom, bus.arriveAt, bus.departureDate, bus.description]
                );
            }
        }
        
        // Add trains
        if (itinerary.trains && itinerary.trains.length > 0) {
            for (const train of itinerary.trains) {
                await client.query(
                    `INSERT INTO trains (trip_id, depart_from, arrive_at, departure_date, description)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [tripId, train.departFrom, train.arriveAt, train.departureDate, train.description]
                );
            }
        }
        
        // Add cabs
        if (itinerary.cabs && itinerary.cabs.length > 0) {
            for (const cab of itinerary.cabs) {
                await client.query(
                    `INSERT INTO cabs (trip_id, pick_up_location, drop_off_location, pick_up_date, description)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [tripId, cab.pickUpLocation, cab.dropOffLocation, cab.pickUpDate, cab.description]
                );
            }
        }
    }
}

module.exports = Trip;