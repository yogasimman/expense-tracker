hat is /**
 * Route Integration Tests
 * Tests the update-status routes with mocked req/res using the real database
 */
const { cleanTestData, createTestUser, createTestTrip, closePool, query } = require('../setup');
const Trip = require('../../models/tripModel');
const Report = require('../../models/reportsModel');

let testUser, testTrip, testReport;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
    testTrip = await createTestTrip(testUser.id);
    testReport = await Report.create({
        userId: testUser.id,
        tripId: testTrip.id,
        reportName: 'TEST_RouteReport',
        businessPurpose: 'Route testing',
        duration: { startDate: '2024-01-01', endDate: '2024-01-15' }
    });
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Update Status Routes - Trip Status', () => {
    it('should update trip status to approved', async () => {
        const updated = await Trip.updateStatus(testTrip.id, 'approved');
        expect(updated).toBeDefined();
        expect(updated.status).toBe('approved');
    });

    it('should update trip status to rejected', async () => {
        const updated = await Trip.updateStatus(testTrip.id, 'rejected');
        expect(updated).toBeDefined();
        expect(updated.status).toBe('rejected');
    });

    it('should return undefined for non-existent trip', async () => {
        const updated = await Trip.updateStatus(999999, 'approved');
        expect(updated).toBeFalsy();
    });
});

describe('Update Status Routes - Report Status', () => {
    it('should approve report with message', async () => {
        const updated = await Report.updateStatus(testReport.id, 'approved', 'Approved!');
        expect(updated).toBeDefined();
        expect(updated.status).toBe('approved');
        expect(updated.approval_message).toBe('Approved!');
    });

    it('should reject report with reason', async () => {
        const updated = await Report.updateStatus(testReport.id, 'rejected', 'Missing info');
        expect(updated).toBeDefined();
        expect(updated.status).toBe('rejected');
        expect(updated.rejection_reason).toBe('Missing info');
    });
});

describe('Trip API - findByUserId', () => {
    it('should return trips for user (simulating /trips/:userId route)', async () => {
        const trips = await Trip.findByUserId(testUser.id);
        expect(Array.isArray(trips)).toBe(true);
        const tripList = trips.map(t => ({
            _id: t.id,
            id: t.id,
            tripName: t.tripName || t.trip_name
        }));
        expect(tripList.length).toBeGreaterThan(0);
        tripList.forEach(t => {
            expect(t._id).toBeDefined();
            expect(t.tripName).toBeDefined();
        });
    });
});

describe('Expense Receipt Flow', () => {
    const Expense = require('../../models/expenseModel');
    let testCategory;

    beforeAll(async () => {
        const { createTestCategory } = require('../setup');
        testCategory = await createTestCategory();
    });

    it('should create expense with receipt and retrieve it', async () => {
        const expense = await Expense.create({
            userId: testUser.id,
            tripId: testTrip.id,
            categoryId: testCategory.id,
            expenseTitle: 'TEST_ReceiptTest',
            amount: 250,
            currency: 'INR',
            date: new Date(),
            receipts: [{
                filename: 'test_receipt.pdf',
                original_filename: 'receipt.pdf',
                content_type: 'application/pdf',
                file_size: 1024,
                file_data: Buffer.from('fake pdf content')
            }]
        });

        expect(expense).toBeDefined();
        expect(expense.receipts).toBeDefined();
        expect(expense.receipts.length).toBe(1);

        // Retrieve with full receipts
        const full = await Expense.findByIdWithFullReceipts(expense.id);
        expect(full.receipts.length).toBe(1);
        expect(full.receipts[0].file_data).toBeDefined();
    });

    it('should add receipt to existing expense', async () => {
        const expense = await Expense.create({
            userId: testUser.id,
            tripId: testTrip.id,
            categoryId: testCategory.id,
            expenseTitle: 'TEST_AddReceipt',
            amount: 100,
            currency: 'INR',
            date: new Date()
        });

        const receipt = await Expense.addReceipt(expense.id, {
            filename: 'added_receipt.jpg',
            original_filename: 'photo.jpg',
            content_type: 'image/jpeg',
            file_size: 2048,
            file_data: Buffer.from('fake image')
        });

        expect(receipt).toBeDefined();
        expect(receipt.filename).toBe('added_receipt.jpg');

        // Verify via findById
        const found = await Expense.findById(expense.id);
        expect(found.receipts.length).toBe(1);
    });

    it('should delete receipt', async () => {
        const expense = await Expense.create({
            userId: testUser.id,
            tripId: testTrip.id,
            categoryId: testCategory.id,
            expenseTitle: 'TEST_DelReceipt',
            amount: 75,
            currency: 'INR',
            date: new Date(),
            receipts: [{
                filename: 'to_delete.png',
                original_filename: 'delete_me.png',
                content_type: 'image/png',
                file_size: 512,
                file_data: Buffer.from('delete me')
            }]
        });

        const receiptId = expense.receipts[0].id;
        const deleted = await Expense.deleteReceipt(receiptId);
        expect(deleted).toBeDefined();
        expect(deleted.id).toBe(receiptId);

        // Verify gone
        const receipt = await Expense.getReceiptById(receiptId);
        expect(receipt).toBeUndefined();
    });
});
