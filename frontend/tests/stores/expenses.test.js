import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExpensesStore } from '@/stores/expenses'

vi.mock('@/api', () => ({
  api: {
    getExpenses: vi.fn(),
    createExpense: vi.fn(),
    deleteExpense: vi.fn(),
    approveExpenses: vi.fn(),
    rejectExpense: vi.fn()
  }
}))

import { api } from '@/api'

describe('Expenses Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchExpenses populates list', async () => {
    const mockData = [
      { id: 1, title: 'Hotel', amount: 5000, status: 'pending' },
      { id: 2, title: 'Food', amount: 800, status: 'approved' }
    ]
    api.getExpenses.mockResolvedValue(mockData)

    const store = useExpensesStore()
    await store.fetchExpenses()

    expect(store.expenses).toEqual(mockData)
    expect(store.loading).toBe(false)
  })

  it('createExpense calls API and refreshes', async () => {
    api.createExpense.mockResolvedValue({ success: true })
    api.getExpenses.mockResolvedValue([])

    const store = useExpensesStore()
    await store.createExpense({ title: 'Test', amount: 100 })

    expect(api.createExpense).toHaveBeenCalledWith({ title: 'Test', amount: 100 })
  })

  it('deleteExpense removes item from list', async () => {
    api.deleteExpense.mockResolvedValue({ success: true })

    const store = useExpensesStore()
    store.expenses = [{ id: 1, title: 'A' }, { id: 2, title: 'B' }]

    await store.deleteExpense(1)
    expect(store.expenses).toEqual([{ id: 2, title: 'B' }])
  })

  it('approveExpenses calls API with IDs', async () => {
    api.approveExpenses.mockResolvedValue({ success: true })
    api.getExpenses.mockResolvedValue([])

    const store = useExpensesStore()
    await store.approveExpenses([1, 2, 3])

    expect(api.approveExpenses).toHaveBeenCalledWith([1, 2, 3])
  })

  it('rejectExpense calls API with ID and reason', async () => {
    api.rejectExpense.mockResolvedValue({ success: true })
    api.getExpenses.mockResolvedValue([])

    const store = useExpensesStore()
    await store.rejectExpense(5, 'Invalid receipt')

    expect(api.rejectExpense).toHaveBeenCalledWith(5, 'Invalid receipt')
  })

  it('handles fetch error', async () => {
    api.getExpenses.mockRejectedValue(new Error('Server error'))

    const store = useExpensesStore()
    await store.fetchExpenses()

    expect(store.error).toBe('Server error')
    expect(store.expenses).toEqual([])
  })
})
