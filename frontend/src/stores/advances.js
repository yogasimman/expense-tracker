import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useAdvancesStore = defineStore('advances', () => {
  const advances = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAdvances(params = {}) {
    loading.value = true
    error.value = null
    try {
      advances.value = await api.getAdvances(params)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createAdvance(data) {
    return await api.createAdvance(data)
  }

  async function deleteAdvance(id) {
    const result = await api.deleteAdvance(id)
    if (result.success) advances.value = advances.value.filter(a => a.id !== id)
    return result
  }

  async function approveAdvances(ids) {
    const result = await api.approveAdvances(ids)
    if (result.success) {
      ids.forEach(id => {
        const idx = advances.value.findIndex(a => a.id === id)
        if (idx !== -1) advances.value[idx].status = 'approved'
      })
    }
    return result
  }

  async function rejectAdvance(id, reason) {
    const result = await api.rejectAdvance(id, reason)
    if (result.success) {
      const idx = advances.value.findIndex(a => a.id === id)
      if (idx !== -1) {
        advances.value[idx].status = 'rejected'
        advances.value[idx].rejection_reason = reason
      }
    }
    return result
  }

  return { advances, loading, error, fetchAdvances, createAdvance, deleteAdvance, approveAdvances, rejectAdvance }
})
