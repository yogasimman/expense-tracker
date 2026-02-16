/**
 * Category Model Tests
 */
const { cleanTestData, createTestCategory, closePool, query } = require('../setup');
const Category = require('../../models/categoryModel');

beforeAll(async () => {
    await cleanTestData();
});

afterAll(async () => {
    await cleanTestData();
    await closePool();
});

describe('Category Model', () => {
    let testCategory;

    describe('create()', () => {
        it('should create category with name and description', async () => {
            testCategory = await createTestCategory({ name: 'TEST_Travel', description: 'Test travel' });
            expect(testCategory).toBeDefined();
            expect(testCategory.id).toBeDefined();
            expect(testCategory.name).toBe('TEST_Travel');
        });

        it('should create category without description', async () => {
            const cat = await Category.create({ name: 'TEST_NoDesc_' + Date.now() });
            expect(cat).toBeDefined();
            expect(cat.description).toBeNull();
        });

        it('should reject duplicate names', async () => {
            await expect(Category.create({ name: testCategory.name })).rejects.toThrow();
        });
    });

    describe('findById()', () => {
        it('should find category by id', async () => {
            const found = await Category.findById(testCategory.id);
            expect(found).toBeDefined();
            expect(found.name).toBe(testCategory.name);
        });

        it('should return undefined for non-existent id', async () => {
            const found = await Category.findById(999999);
            expect(found).toBeUndefined();
        });
    });

    describe('findByName()', () => {
        it('should find category by name (case-insensitive)', async () => {
            const found = await Category.findByName(testCategory.name.toLowerCase());
            expect(found).toBeDefined();
            expect(found.id).toBe(testCategory.id);
        });
    });

    describe('findAll()', () => {
        it('should return all categories', async () => {
            const cats = await Category.findAll();
            expect(Array.isArray(cats)).toBe(true);
            expect(cats.length).toBeGreaterThan(0);
        });
    });

    describe('update()', () => {
        it('should update category name', async () => {
            const newName = 'TEST_UpdatedCat_' + Date.now();
            const updated = await Category.update(testCategory.id, { name: newName });
            expect(updated.name).toBe(newName);
            testCategory = updated; // update reference
        });
    });

    describe('nameExists()', () => {
        it('should return true for existing name', async () => {
            const exists = await Category.nameExists(testCategory.name);
            expect(exists).toBe(true);
        });

        it('should return false for non-existent name', async () => {
            const exists = await Category.nameExists('ZZZ_NOPE_' + Date.now());
            expect(exists).toBe(false);
        });
    });

    describe('delete()', () => {
        it('should delete category', async () => {
            const toDelete = await createTestCategory();
            const deleted = await Category.delete(toDelete.id);
            expect(deleted.id).toBe(toDelete.id);
        });
    });
});
