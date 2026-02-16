import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const checked = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function checkAuth() {
    try {
      const data = await api.me()
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      checked.value = true
    }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const data = await api.login(email, password)
      user.value = data.user
      checked.value = true
      return data
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await api.logout()
    user.value = null
    checked.value = false
  }

  async function updateProfile(data) {
    if (!user.value) return
    const result = await api.updateUser(user.value.id, data)
    if (result.user) {
      user.value = { ...user.value, ...result.user }
    }
    return result
  }

  return { user, checked, loading, isAuthenticated, isAdmin, checkAuth, login, logout, updateProfile }
})
