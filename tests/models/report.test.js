/**
 * Report Model Tests
 */
const { cleanTestData, createTestUser, createTestTrip, createTestCategory, closePool, query } = require('../setup');
const Report = require('../../models/reportsModel');
const Expense = require('../../models/expenseModel');
const Advance = require('../../models/advancesModel');

let testUser, testTrip, testCategory;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
    testTrip = await createTestTrip(testUser.id);
    testCategory = await createTestCategory();

    // Create a test expense and advance for report detail tests
    await Expense.create({
        userId: testUser.id,
        tripId: testTrip.id,
        categoryId: testCategory.id,
        expenseTitle: 'TEST_ReportExpense',
        amount: 500,
        currency: 'INR',
        date: new Date()
    });
    await Advance.create({
        userId: testUser.id,
        tripId: testTrip.id,
        amount: 200,
        currency: 'INR',
        paidThrough: 'cash',
        notes: 'TEST_ReportAdvance'
    });
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Report Model', () => {
    let testReport;

    describe('create()', () => {
        it('should create a report with valid data', async () => {
            testReport = await Report.create({
                userId: testUser.id,
                tripId: testTrip.id,
                reportName: 'TEST_Quarterly Report',
                businessPurpose: 'Client meeting expenses',
                duration: {
                    startDate: '2024-01-01',
                    endDate: '2024-01-15'
                }
            });

            expect(testReport).toBeDefined();
            expect(testReport.id).toBeDefined();
            expect(testReport.report_name).toBe('TEST_Quarterly Report');
            expect(testReport.business_purpose).toBe('Client meeting expenses');
            expect(testReport.status).toBe('submitted');
        });

        it('should create a report with custom status', async () => {
            const report = await Report.create({
                userId: testUser.id,
                tripId: testTrip.id,
                reportName: 'TEST_Draft Report',
                businessPurpose: 'Draft',
                duration: { startDate: '2024-02-01', endDate: '2024-02-10' },
                status: 'approved'
            });
            expect(report.status).toBe('approved');
        });

        it('should reject invalid foreign keys', async () => {
            await expect(
                Report.create({
                    userId: 999999,
                    tripId: testTrip.id,
                    reportName: 'TEST_Bad Report',
                    businessPurpose: 'Test',
                    duration: { startDate: '2024-01-01', endDate: '2024-01-10' }
                })
            ).rejects.toThrow();
        });
    });

    describe('findById()', () => {
        it('should find report by id with joins', async () => {
            const found = await Report.findById(testReport.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(testReport.id);
            expect(found.user_name).toBeDefined();
            expect(found.trip_name).toBeDefined();
            expect(found.duration).toBeDefined();
            expect(found.duration.startDate).toBeDefined();
            expect(found.duration.endDate).toBeDefined();
        });

        it('should return null for non-existent id', async () => {
            const found = await Report.findById(999999);
            expect(found).toBeNull();
        });
    });

    describe('findAll()', () => {
        it('should return all reports', async () => {
            const reports = await Report.findAll();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBeGreaterThan(0);
        });

        it('should include duration object', async () => {
            const reports = await Report.findAll({ userId: testUser.id });
            reports.forEach(r => {
                expect(r.duration).toBeDefined();
                expect(r.duration.startDate).toBeDefined();
            });
        });

        it('should filter by userId', async () => {
            const reports = await Report.findAll({ userId: testUser.id });
            reports.forEach(r => expect(r.user_id).toBe(testUser.id));
        });

        it('should filter by status', async () => {
            const reports = await Report.findAll({ status: 'submitted' });
            reports.forEach(r => expect(r.status).toBe('submitted'));
        });
    });

    describe('findByUserId()', () => {
        it('should return reports for user', async () => {
            const reports = await Report.findByUserId(testUser.id);
            expect(reports.length).toBeGreaterThan(0);
            reports.forEach(r => expect(r.user_id).toBe(testUser.id));
        });
    });

    describe('findByTripId()', () => {
        it('should return reports for trip', async () => {
            const reports = await Report.findByTripId(testTrip.id);
            expect(reports.length).toBeGreaterThan(0);
            reports.forEach(r => expect(r.trip_id).toBe(testTrip.id));
        });
    });

    describe('update()', () => {
        it('should update report fields', async () => {
            const updated = await Report.update(testReport.id, {
                report_name: 'TEST_Updated Report'
            });
            expect(updated.report_name).toBe('TEST_Updated Report');
        });

        it('should update duration', async () => {
            const updated = await Report.update(testReport.id, {
                duration: { startDate: '2024-03-01', endDate: '2024-03-20' }
            });
            expect(updated.duration).toBeDefined();
        });

        it('should throw for empty update', async () => {
            await expect(Report.update(testReport.id, {})).rejects.toThrow('No fields to update');
        });
    });

    describe('updateStatus()', () => {
        it('should approve report with message', async () => {
            const approved = await Report.updateStatus(testReport.id, 'approved', 'Looks good');
            expect(approved.status).toBe('approved');
            expect(approved.approval_message).toBe('Looks good');
            expect(approved.reimbursement_date).toBeDefined();
        });

        it('should reject report with reason', async () => {
            const report = await Report.create({
                userId: testUser.id,
                tripId: testTrip.id,
                reportName: 'TEST_Reject Report',
                businessPurpose: 'Test rejection',
                duration: { startDate: '2024-04-01', endDate: '2024-04-10' }
            });
            const rejected = await Report.updateStatus(report.id, 'rejected', 'Missing receipts');
            expect(rejected.status).toBe('rejected');
            expect(rejected.rejection_reason).toBe('Missing receipts');
        });
    });

    describe('getStatistics()', () => {
        it('should return statistics', async () => {
            const stats = await Report.getStatistics({ userId: testUser.id });
            expect(stats).toBeDefined();
            expect(parseInt(stats.total_count)).toBeGreaterThan(0);
        });

        it('should count by status', async () => {
            const stats = await Report.getStatistics({ userId: testUser.id });
            expect(stats.submitted_count).toBeDefined();
            expect(stats.approved_count).toBeDefined();
            expect(stats.rejected_count).toBeDefined();
        });
    });

    describe('findByIdWithDetails()', () => {
        it('should return report with expenses and advances', async () => {
            const detailed = await Report.findByIdWithDetails(testReport.id);
            expect(detailed).toBeDefined();
            expect(Array.isArray(detailed.expenses)).toBe(true);
            expect(Array.isArray(detailed.advances)).toBe(true);
            expect(detailed.totalExpenses).toBeDefined();
            expect(detailed.totalAdvances).toBeDefined();
            expect(detailed.netAmount).toBeDefined();
        });

        it('should return null for non-existent id', async () => {
            const detailed = await Report.findByIdWithDetails(999999);
            expect(detailed).toBeNull();
        });
    });

    describe('getPendingReports()', () => {
        it('should return only submitted reports', async () => {
            // Create a fresh submitted report
            await Report.create({
                userId: testUser.id,
                tripId: testTrip.id,
                reportName: 'TEST_Pending Report',
                businessPurpose: 'Pending test',
                duration: { startDate: '2024-05-01', endDate: '2024-05-10' }
            });
            const pending = await Report.getPendingReports();
            pending.forEach(r => expect(r.status).toBe('submitted'));
        });
    });

    describe('delete()', () => {
        it('should delete report', async () => {
            const report = await Report.create({
                userId: testUser.id,
                tripId: testTrip.id,
                reportName: 'TEST_Delete Report',
                businessPurpose: 'Delete test',
                duration: { startDate: '2024-06-01', endDate: '2024-06-10' }
            });
            const deleted = await Report.delete(report.id);
            expect(deleted.id).toBe(report.id);
            const found = await Report.findById(report.id);
            expect(found).toBeNull();
        });
    });
});
