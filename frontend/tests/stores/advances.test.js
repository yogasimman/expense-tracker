import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdvancesStore } from '@/stores/advances'

vi.mock('@/api', () => ({
  api: {
    getAdvances: vi.fn(),
    createAdvance: vi.fn(),
    deleteAdvance: vi.fn(),
    approveAdvances: vi.fn(),
    rejectAdvance: vi.fn()
  }
}))

import { api } from '@/api'

describe('Advances Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAdvances populates list', async () => {
    const mockData = [
      { id: 1, amount: 10000, status: 'pending' },
      { id: 2, amount: 5000, status: 'approved' }
    ]
    api.getAdvances.mockResolvedValue(mockData)

    const store = useAdvancesStore()
    await store.fetchAdvances()

    expect(store.advances).toEqual(mockData)
  })

  it('createAdvance calls API and refreshes', async () => {
    api.createAdvance.mockResolvedValue({ success: true })
    api.getAdvances.mockResolvedValue([])

    const store = useAdvancesStore()
    await store.createAdvance({ amount: 5000, paidThrough: 'cash' })

    expect(api.createAdvance).toHaveBeenCalledWith({ amount: 5000, paidThrough: 'cash' })
  })

  it('deleteAdvance removes item from list', async () => {
    api.deleteAdvance.mockResolvedValue({ success: true })

    const store = useAdvancesStore()
    store.advances = [{ id: 1, amount: 1000 }, { id: 2, amount: 2000 }]

    await store.deleteAdvance(1)
    expect(store.advances).toEqual([{ id: 2, amount: 2000 }])
  })

  it('approveAdvances calls API', async () => {
    api.approveAdvances.mockResolvedValue({ success: true })
    api.getAdvances.mockResolvedValue([])

    const store = useAdvancesStore()
    await store.approveAdvances([1, 2])

    expect(api.approveAdvances).toHaveBeenCalledWith([1, 2])
  })

  it('rejectAdvance calls API with reason', async () => {
    api.rejectAdvance.mockResolvedValue({ success: true })
    api.getAdvances.mockResolvedValue([])

    const store = useAdvancesStore()
    await store.rejectAdvance(3, 'Not justified')

    expect(api.rejectAdvance).toHaveBeenCalledWith(3, 'Not justified')
  })
})
