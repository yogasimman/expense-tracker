import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTripsStore } from '@/stores/trips'

vi.mock('@/api', () => ({
  api: {
    getTrips: vi.fn(),
    getTrip: vi.fn(),
    createTrip: vi.fn(),
    deleteTrip: vi.fn(),
    updateTripStatus: vi.fn(),
    finishTrip: vi.fn()
  }
}))

import { api } from '@/api'

describe('Trips Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty trips', () => {
    const store = useTripsStore()
    expect(store.trips).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('fetchTrips populates trips', async () => {
    const mockTrips = [
      { id: 1, trip_name: 'Trip 1', status: 'pending' },
      { id: 2, trip_name: 'Trip 2', status: 'approved' }
    ]
    api.getTrips.mockResolvedValue(mockTrips)

    const store = useTripsStore()
    await store.fetchTrips()

    expect(store.trips).toEqual(mockTrips)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchTrips handles error', async () => {
    api.getTrips.mockRejectedValue(new Error('Network error'))

    const store = useTripsStore()
    await store.fetchTrips()

    expect(store.trips).toEqual([])
    expect(store.error).toBe('Network error')
  })

  it('createTrip calls API and refreshes list', async () => {
    api.createTrip.mockResolvedValue({ success: true })
    api.getTrips.mockResolvedValue([{ id: 1, trip_name: 'New Trip' }])

    const store = useTripsStore()
    await store.createTrip({ tripName: 'New Trip', travelType: 'domestic' })

    expect(api.createTrip).toHaveBeenCalledWith({ tripName: 'New Trip', travelType: 'domestic' })
    expect(api.getTrips).toHaveBeenCalled()
  })

  it('deleteTrip removes trip from list', async () => {
    api.deleteTrip.mockResolvedValue({ success: true })

    const store = useTripsStore()
    store.trips = [
      { id: 1, trip_name: 'A' },
      { id: 2, trip_name: 'B' }
    ]

    await store.deleteTrip(1)
    expect(store.trips).toEqual([{ id: 2, trip_name: 'B' }])
  })

  it('updateStatus updates trip status in list', async () => {
    api.updateTripStatus.mockResolvedValue({ success: true })

    const store = useTripsStore()
    store.trips = [{ id: 1, trip_name: 'A', status: 'pending' }]

    await store.updateStatus(1, 'approved')
    expect(store.trips[0].status).toBe('approved')
  })

  it('finishTrip sets status to finished', async () => {
    api.finishTrip.mockResolvedValue({ success: true })

    const store = useTripsStore()
    store.trips = [{ id: 1, trip_name: 'A', status: 'approved' }]

    await store.finishTrip(1)
    expect(store.trips[0].status).toBe('finished')
  })
})
