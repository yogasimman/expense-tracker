import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      categories.value = await api.getCategories()
    } catch (e) {
      console.error('Error fetching categories:', e)
    } finally {
      loading.value = false
    }
  }

  async function addCategory(name) {
    const result = await api.createCategory(name)
    if (result.success) categories.value.push(result.category)
    return result
  }

  async function removeCategory(id) {
    const result = await api.deleteCategory(id)
    if (result.success) categories.value = categories.value.filter(c => c.id !== id)
    return result
  }

  return { categories, loading, fetchCategories, addCategory, removeCategory }
})
