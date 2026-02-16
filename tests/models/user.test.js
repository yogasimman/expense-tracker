/**
 * User Model Tests
 */
const { cleanTestData, createTestUser, closePool, query } = require('../setup');
const User = require('../../models/userModel');

beforeAll(async () => {
    await cleanTestData();
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('User Model', () => {
    let testUser;

    describe('create()', () => {
        it('should create a new user with valid data', async () => {
            testUser = await createTestUser({
                name: 'Test Create User',
                role: 'submitter'
            });

            expect(testUser).toBeDefined();
            expect(testUser.id).toBeDefined();
            expect(testUser.name).toBe('Test Create User');
            expect(testUser.role).toBe('submitter');
            expect(testUser.department).toBe('Testing');
        });

        it('should reject duplicate email', async () => {
            await expect(
                User.create({
                    name: 'Dup User',
                    email: testUser.email,
                    password: 'hashed',
                    designation: 'X',
                    employee_id: 'TEST_DUP_' + Date.now(),
                    mobile: '999',
                    department: 'X',
                    role: 'submitter'
                })
            ).rejects.toThrow();
        });

        it('should default role to submitter', async () => {
            const u = await createTestUser();
            expect(u.role).toBe('submitter');
        });
    });

    describe('findById()', () => {
        it('should find user by id', async () => {
            const found = await User.findById(testUser.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(testUser.id);
            expect(found.email).toBe(testUser.email);
        });

        it('should return undefined for non-existent id', async () => {
            const found = await User.findById(999999);
            expect(found).toBeUndefined();
        });
    });

    describe('findByEmail()', () => {
        it('should find user by email', async () => {
            const found = await User.findByEmail(testUser.email);
            expect(found).toBeDefined();
            expect(found.id).toBe(testUser.id);
        });

        it('should return undefined for non-existent email', async () => {
            const found = await User.findByEmail('nonexistent@test.com');
            expect(found).toBeUndefined();
        });
    });

    describe('findAll()', () => {
        it('should return all users', async () => {
            const users = await User.findAll();
            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBeGreaterThan(0);
        });

        it('should filter by role', async () => {
            const admin = await createTestUser({ role: 'admin' });
            const admins = await User.findAll({ role: 'admin' });
            expect(admins.some(u => u.id === admin.id)).toBe(true);
            admins.forEach(u => expect(u.role).toBe('admin'));
        });
    });

    describe('update()', () => {
        it('should update user fields', async () => {
            const updated = await User.update(testUser.id, { name: 'Updated Name' });
            expect(updated.name).toBe('Updated Name');
        });

        it('should throw for empty update', async () => {
            await expect(User.update(testUser.id, {})).rejects.toThrow('No fields to update');
        });
    });

    describe('emailExists()', () => {
        it('should return true for existing email', async () => {
            const exists = await User.emailExists(testUser.email);
            expect(exists).toBe(true);
        });

        it('should return false for non-existent email', async () => {
            const exists = await User.emailExists('nope_never@test.com');
            expect(exists).toBe(false);
        });

        it('should exclude specific id', async () => {
            const exists = await User.emailExists(testUser.email, testUser.id);
            expect(exists).toBe(false);
        });
    });

    describe('delete()', () => {
        it('should delete user', async () => {
            const toDelete = await createTestUser();
            const deleted = await User.delete(toDelete.id);
            expect(deleted.id).toBe(toDelete.id);
            const found = await User.findById(toDelete.id);
            expect(found).toBeUndefined();
        });
    });

    describe('getStatistics()', () => {
        it('should return statistics for user', async () => {
            const stats = await User.getStatistics(testUser.id);
            expect(stats).toBeDefined();
            expect(stats.total_trips).toBeDefined();
            expect(stats.total_expenses).toBeDefined();
        });
    });
});
