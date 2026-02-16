import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchExpenses(params = {}) {
    loading.value = true
    error.value = null
    try {
      expenses.value = await api.getExpenses(params)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createExpense(data) {
    return await api.createExpense(data)
  }

  async function deleteExpense(id) {
    const result = await api.deleteExpense(id)
    if (result.success) expenses.value = expenses.value.filter(e => e.id !== id)
    return result
  }

  async function approveExpenses(ids) {
    const result = await api.approveExpenses(ids)
    if (result.success) {
      ids.forEach(id => {
        const idx = expenses.value.findIndex(e => e.id === id)
        if (idx !== -1) expenses.value[idx].status = 'approved'
      })
    }
    return result
  }

  async function rejectExpense(id, reason) {
    const result = await api.rejectExpense(id, reason)
    if (result.success) {
      const idx = expenses.value.findIndex(e => e.id === id)
      if (idx !== -1) {
        expenses.value[idx].status = 'rejected'
        expenses.value[idx].rejection_reason = reason
      }
    }
    return result
  }

  return { expenses, loading, error, fetchExpenses, createExpense, deleteExpense, approveExpenses, rejectExpense }
})
