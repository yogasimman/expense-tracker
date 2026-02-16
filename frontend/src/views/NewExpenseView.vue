<template>
  <div>
    <PageHeader title="New Expense" icon="bi bi-receipt-cutoff" subtitle="Record a new expense" />

    <div class="form-card card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input v-model="form.title" type="text" class="form-input" placeholder="e.g. Hotel stay — Mumbai" required />
            </div>
            <div class="form-group">
              <label class="form-label">Amount *</label>
              <div class="input-with-prefix">
                <span class="input-prefix">₹</span>
                <input v-model.number="form.amount" type="number" step="0.01" min="0" class="form-input pl-prefix" placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-input">
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input v-model="form.expenseDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select v-model="form.category" class="form-input" required>
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trip *</label>
              <select v-model="form.tripId" class="form-input" required>
                <option value="" disabled>Select trip</option>
                <option v-for="trip in trips" :key="trip.id" :value="trip.id">{{ trip.tripName || trip.trip_name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-input" rows="3" placeholder="Optional details about this expense"></textarea>
          </div>

          <div class="form-actions">
            <router-link to="/app/expenses" class="btn btn-outline">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span>
              {{ submitting ? 'Saving…' : 'Create Expense' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpensesStore } from '@/stores/expenses'
import { useCategoriesStore } from '@/stores/categories'
import { useTripsStore } from '@/stores/trips'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const expenseStore = useExpensesStore()
const categoryStore = useCategoriesStore()
const tripStore = useTripsStore()
const toast = useToast()
const submitting = ref(false)

const trips = ref([])

const form = reactive({
  title: '',
  amount: '',
  currency: 'INR',
  expenseDate: new Date().toISOString().split('T')[0],
  category: '',
  tripId: '',
  description: ''
})

async function submit() {
  if (!form.title.trim()) return toast.error('Title is required')
  if (!form.amount || form.amount <= 0) return toast.error('Valid amount is required')
  if (!form.category) return toast.error('Category is required')
  if (!form.tripId) return toast.error('Trip is required')

  submitting.value = true
  try {
    await expenseStore.createExpense({
      expenseTitle: form.title,
      amount: form.amount,
      currency: form.currency,
      date: form.expenseDate,
      categoryId: form.category,
      tripId: form.tripId,
      description: form.description
    })
    toast.success('Expense created')
    router.push('/app/expenses')
  } catch (e) {
    toast.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    tripStore.fetchTrips()
  ])
  // Only show approved trips
  trips.value = tripStore.trips.filter(t => t.status === 'approved')
})
</script>

<style scoped>
.form-card { max-width: 700px; }

.grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
}
@media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }

.input-with-prefix { position: relative; }
.input-prefix {
  position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted); font-weight: 500; font-size: var(--font-size-sm);
  pointer-events: none;
}
.pl-prefix { padding-left: var(--space-8); }

.form-actions {
  display: flex; justify-content: flex-end; gap: var(--space-3);
  margin-top: var(--space-6); padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}
</style>
