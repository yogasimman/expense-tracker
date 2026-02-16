/**
 * Expense Model Tests
 */
const { cleanTestData, createTestUser, createTestTrip, createTestCategory, closePool } = require('../setup');
const Expense = require('../../models/expenseModel');

let testUser, testTrip, testCategory;

beforeAll(async () => {
    await cleanTestData();
    testUser = await createTestUser();
    testTrip = await createTestTrip(testUser.id);
    testCategory = await createTestCategory();
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Expense Model', () => {
    let testExpense;

    describe('create()', () => {
        it('should create an expense with valid data', async () => {
            testExpense = await Expense.create({
                userId: testUser.id,
                tripId: testTrip.id,
                categoryId: testCategory.id,
                expenseTitle: 'TEST_Lunch Meeting',
                amount: 150.50,
                currency: 'INR',
                description: 'Team lunch',
                date: new Date()
            });

            expect(testExpense).toBeDefined();
            expect(testExpense.id).toBeDefined();
            expect(testExpense.expense_title).toBe('TEST_Lunch Meeting');
            expect(parseFloat(testExpense.amount)).toBe(150.50);
            expect(testExpense.currency).toBe('INR');
        });

        it('should reject invalid currency', async () => {
            await expect(
                Expense.create({
                    userId: testUser.id,
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_Bad Currency',
                    amount: 100,
                    currency: 'EUR',
                    date: new Date()
                })
            ).rejects.toThrow();
        });

        it('should reject negative amount', async () => {
            await expect(
                Expense.create({
                    userId: testUser.id,
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_Negative',
                    amount: -50,
                    currency: 'INR',
                    date: new Date()
                })
            ).rejects.toThrow();
        });

        it('should reject invalid foreign keys', async () => {
            await expect(
                Expense.create({
                    userId: 999999,
                    tripId: testTrip.id,
                    categoryId: testCategory.id,
                    expenseTitle: 'TEST_BadUser',
                    amount: 100,
                    currency: 'INR',
                    date: new Date()
                })
            ).rejects.toThrow();
        });
    });

    describe('findById()', () => {
        it('should find expense by id', async () => {
            const found = await Expense.findById(testExpense.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(testExpense.id);
            expect(found.receipts).toBeDefined();
        });

        it('should return null for non-existent id', async () => {
            const found = await Expense.findById(999999);
            expect(found).toBeNull();
        });
    });

    describe('findAll()', () => {
        it('should return all expenses', async () => {
            const expenses = await Expense.findAll();
            expect(Array.isArray(expenses)).toBe(true);
            expect(expenses.length).toBeGreaterThan(0);
        });

        it('should filter by userId', async () => {
            const expenses = await Expense.findAll({ userId: testUser.id });
            expenses.forEach(e => expect(e.user_id).toBe(testUser.id));
        });

        it('should filter by tripId', async () => {
            const expenses = await Expense.findAll({ tripId: testTrip.id });
            expenses.forEach(e => expect(e.trip_id).toBe(testTrip.id));
        });

        it('should filter by categoryId', async () => {
            const expenses = await Expense.findAll({ categoryId: testCategory.id });
            expenses.forEach(e => expect(e.category_id).toBe(testCategory.id));
        });
    });

    describe('findByUserId()', () => {
        it('should return expenses for user', async () => {
            const expenses = await Expense.findByUserId(testUser.id);
            expect(expenses.length).toBeGreaterThan(0);
        });
    });

    describe('findByTripId()', () => {
        it('should return expenses for trip', async () => {
            const expenses = await Expense.findByTripId(testTrip.id);
            expect(expenses.length).toBeGreaterThan(0);
        });
    });

    describe('update()', () => {
        it('should update expense fields', async () => {
            const updated = await Expense.update(testExpense.id, { amount: 200.00 });
            expect(parseFloat(updated.amount)).toBe(200.00);
        });

        it('should throw for empty update', async () => {
            await expect(Expense.update(testExpense.id, {})).rejects.toThrow('No fields to update');
        });
    });

    describe('getStatistics()', () => {
        it('should return statistics', async () => {
            const stats = await Expense.getStatistics({ userId: testUser.id });
            expect(stats).toBeDefined();
            expect(parseInt(stats.total_count)).toBeGreaterThan(0);
            expect(parseFloat(stats.total_amount)).toBeGreaterThan(0);
        });
    });

    describe('getSummaryByCategory()', () => {
        it('should return summary grouped by category', async () => {
            const summary = await Expense.getSummaryByCategory({ userId: testUser.id });
            expect(Array.isArray(summary)).toBe(true);
        });
    });

    describe('delete()', () => {
        it('should delete expense', async () => {
            const exp = await Expense.create({
                userId: testUser.id,
                tripId: testTrip.id,
                categoryId: testCategory.id,
                expenseTitle: 'TEST_ToDelete',
                amount: 10,
                currency: 'INR',
                date: new Date()
            });
            const deleted = await Expense.delete(exp.id);
            expect(deleted.id).toBe(exp.id);
            const found = await Expense.findById(exp.id);
            expect(found).toBeNull();
        });
    });
});
