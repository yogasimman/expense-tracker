import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useTripsStore = defineStore('trips', () => {
  const trips = ref([])
  const currentTrip = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchTrips(params = {}) {
    loading.value = true
    error.value = null
    try {
      trips.value = await api.getTrips(params)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchTrip(id) {
    loading.value = true
    error.value = null
    try {
      currentTrip.value = await api.getTrip(id)
      return currentTrip.value
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createTrip(data) {
    const result = await api.createTrip(data)
    if (result.success) await fetchTrips()
    return result
  }

  async function deleteTrip(id) {
    const result = await api.deleteTrip(id)
    if (result.success) trips.value = trips.value.filter(t => t.id !== id)
    return result
  }

  async function updateStatus(id, status) {
    const result = await api.updateTripStatus(id, status)
    if (result.success) {
      const idx = trips.value.findIndex(t => t.id === id)
      if (idx !== -1) trips.value[idx].status = status
    }
    return result
  }

  async function finishTrip(id) {
    const result = await api.finishTrip(id)
    if (result.success) {
      const idx = trips.value.findIndex(t => t.id === id)
      if (idx !== -1) trips.value[idx].status = 'finished'
    }
    return result
  }

  return { trips, currentTrip, loading, error, fetchTrips, fetchTrip, createTrip, deleteTrip, updateStatus, finishTrip }
})
