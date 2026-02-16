<template>
  <div v-if="loading" class="loading-center"><div class="loading-spinner"></div></div>
  <div v-else-if="!trip">
    <div class="empty-state"><p>Trip not found</p></div>
  </div>
  <div v-else>
    <PageHeader :title="trip.tripName || trip.trip_name" icon="bi bi-airplane-fill" :subtitle="`${trip.travelType || trip.travel_type} trip`">
      <StatusBadge :status="trip.status" />
    </PageHeader>

    <!-- Trip Info Card -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="trip-info-grid">
          <div><span class="info-label">Type</span><span class="info-value capitalize">{{ trip.travelType || trip.travel_type }}</span></div>
          <div><span class="info-label">Status</span><StatusBadge :status="trip.status" /></div>
          <div><span class="info-label">Created</span><span class="info-value">{{ formatDate(trip.created_at) }}</span></div>
          <div v-if="stats"><span class="info-label">Total Expense</span><span class="info-value">₹{{ Number(stats.total_expense_amount || 0).toLocaleString('en-IN') }}</span></div>
          <div v-if="stats"><span class="info-label">Total Advance</span><span class="info-value">₹{{ Number(stats.total_advance_amount || 0).toLocaleString('en-IN') }}</span></div>
        </div>
        <div v-if="trip.description" class="trip-description mt-3">
          <span class="info-label">Description</span>
          <p class="info-value">{{ trip.description }}</p>
        </div>
      </div>
    </div>

    <!-- Itinerary Accordion -->
    <div v-if="hasItinerary" class="card mb-4">
      <div class="card-header cursor-pointer" @click="showItinerary = !showItinerary">
        <span class="card-title"><i class="bi bi-map me-2"></i>Itinerary</span>
        <i :class="showItinerary ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
      </div>
      <div v-if="showItinerary" class="card-body">
        <div v-for="(items, type) in activeItinerary" :key="type" class="itinerary-section">
          <h4 class="section-label"><i :class="itineraryIcon(type)"></i> {{ type }}</h4>
          <div v-for="(item, i) in items" :key="i" class="itinerary-item">
            <template v-if="type === 'cabs'">
              <span>{{ item.pickUpLocation }} → {{ item.dropOffLocation }}</span>
              <span class="text-muted text-sm">{{ formatDate(item.pickUpDate) }}</span>
            </template>
            <template v-else>
              <span>{{ item.departFrom }} → {{ item.arriveAt }}</span>
              <span class="text-muted text-sm">{{ formatDate(item.departureDate) }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses Section -->
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="bi bi-receipt me-2"></i>Expenses ({{ expenses.length }})</span>
      </div>
      <div class="card-body card-body-flush">
        <DataTable
          :columns="expenseColumns"
          :data="expenses"
          :selectable="auth.isAdmin && trip.status !== 'finished'"
          :selectableFilter="row => row.status === 'pending'"
          v-model:selected="selectedExpenses"
        >
          <template #cell-status="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-amount="{ row }">
            ₹{{ Number(row.amount).toLocaleString('en-IN') }}
          </template>
          <template #actions="{ row }">
            <button v-if="auth.isAdmin && row.status === 'pending'" class="btn btn-ghost btn-sm text-danger" @click="openRejectModal('expense', row)">
              <i class="bi bi-x-circle"></i>
            </button>
            <button v-if="!auth.isAdmin && row.status === 'pending'" class="btn btn-ghost btn-sm text-danger" @click="deleteExpense(row)">
              <i class="bi bi-trash"></i>
            </button>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Admin Expense Actions -->
    <div v-if="auth.isAdmin && selectedExpenses.length" class="bulk-actions">
      <span class="bulk-count">{{ selectedExpenses.length }} expense(s)</span>
      <button class="btn btn-success btn-sm" @click="approveExpenses"><i class="bi bi-check-lg"></i> Approve</button>
      <button class="btn btn-danger btn-sm" @click="openBulkRejectModal('expense')"><i class="bi bi-x-lg"></i> Reject</button>
    </div>

    <!-- Advances Section -->
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="bi bi-credit-card me-2"></i>Advances ({{ advances.length }})</span>
      </div>
      <div class="card-body card-body-flush">
        <DataTable
          :columns="advanceColumns"
          :data="advances"
          :selectable="auth.isAdmin && trip.status !== 'finished'"
          :selectableFilter="row => row.status === 'pending'"
          v-model:selected="selectedAdvances"
        >
          <template #cell-status="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-amount="{ row }">
            ₹{{ Number(row.amount).toLocaleString('en-IN') }}
          </template>
          <template #actions="{ row }">
            <button v-if="auth.isAdmin && row.status === 'pending'" class="btn btn-ghost btn-sm text-danger" @click="openRejectModal('advance', row)">
              <i class="bi bi-x-circle"></i>
            </button>
            <button v-if="!auth.isAdmin && row.status === 'pending'" class="btn btn-ghost btn-sm text-danger" @click="deleteAdvance(row)">
              <i class="bi bi-trash"></i>
            </button>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Admin Advance Actions -->
    <div v-if="auth.isAdmin && selectedAdvances.length" class="bulk-actions bulk-actions-advance">
      <span class="bulk-count">{{ selectedAdvances.length }} advance(s)</span>
      <button class="btn btn-success btn-sm" @click="approveAdvances"><i class="bi bi-check-lg"></i> Approve</button>
      <button class="btn btn-danger btn-sm" @click="openBulkRejectModal('advance')"><i class="bi bi-x-lg"></i> Reject</button>
    </div>

    <!-- Finish Trip Button (Admin) -->
    <div v-if="auth.isAdmin && trip.status === 'approved'" class="finish-section card">
      <div class="card-body d-flex-center gap-3">
        <p class="text-muted">All expenses and advances must be approved/rejected before finishing.</p>
        <button class="btn btn-primary" :disabled="!canFinish" @click="doFinishTrip">
          <i class="bi bi-check2-all"></i> Finish Trip
        </button>
      </div>
    </div>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Reject Item" size="sm">
      <div class="form-group">
        <label class="form-label">Reason for rejection</label>
        <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Enter reason..."></textarea>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showRejectModal = false">Cancel</button>
        <button class="btn btn-danger" @click="doReject" :disabled="!rejectReason.trim()">Reject</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTripsStore } from '@/stores/trips'
import { useExpensesStore } from '@/stores/expenses'
import { useAdvancesStore } from '@/stores/advances'
import { useToast } from '@/composables/useToast'
import { api } from '@/api'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const tripStore = useTripsStore()
const expenseStore = useExpensesStore()
const advanceStore = useAdvancesStore()
const toast = useToast()

const loading = ref(true)
const trip = ref(null)
const stats = ref(null)
const expenses = ref([])
const advances = ref([])
const selectedExpenses = ref([])
const selectedAdvances = ref([])
const showItinerary = ref(false)
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null) // { type: 'expense'|'advance', item?, bulk: bool }

const expenseColumns = [
  { key: 'expense_title', label: 'Title', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'category_name', label: 'Category' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', type: 'date' }
]

const advanceColumns = [
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'paid_through', label: 'Paid Through' },
  { key: 'reference_id', label: 'Reference' },
  { key: 'status', label: 'Status', sortable: true }
]

const hasItinerary = computed(() => {
  if (!trip.value?.itinerary) return false
  const it = trip.value.itinerary
  return (it.flights?.length || it.buses?.length || it.trains?.length || it.cabs?.length)
})

const activeItinerary = computed(() => {
  if (!trip.value?.itinerary) return {}
  const result = {}
  for (const [k, v] of Object.entries(trip.value.itinerary)) {
    if (v && v.length) result[k] = v
  }
  return result
})

const canFinish = computed(() => {
  const allExpDone = expenses.value.every(e => e.status !== 'pending')
  const allAdvDone = advances.value.every(a => a.status !== 'pending')
  return allExpDone && allAdvDone
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function itineraryIcon(type) {
  const map = { flights: 'bi bi-airplane', buses: 'bi bi-bus-front', trains: 'bi bi-train-front', cabs: 'bi bi-taxi-front' }
  return map[type] || 'bi bi-geo'
}

function openRejectModal(type, item) {
  rejectTarget.value = { type, item, bulk: false }
  rejectReason.value = ''
  showRejectModal.value = true
}

function openBulkRejectModal(type) {
  rejectTarget.value = { type, bulk: true }
  rejectReason.value = ''
  showRejectModal.value = true
}

async function doReject() {
  const t = rejectTarget.value
  try {
    if (t.type === 'expense') {
      if (t.bulk) {
        for (const exp of selectedExpenses.value) {
          await expenseStore.rejectExpense(exp.id, rejectReason.value)
        }
        selectedExpenses.value = []
      } else {
        await expenseStore.rejectExpense(t.item.id, rejectReason.value)
      }
    } else {
      if (t.bulk) {
        for (const adv of selectedAdvances.value) {
          await advanceStore.rejectAdvance(adv.id, rejectReason.value)
        }
        selectedAdvances.value = []
      } else {
        await advanceStore.rejectAdvance(t.item.id, rejectReason.value)
      }
    }
    showRejectModal.value = false
    toast.success('Rejected successfully')
    await loadData()
  } catch (e) {
    toast.error(e.message)
  }
}

async function approveExpenses() {
  try {
    await expenseStore.approveExpenses(selectedExpenses.value.map(e => e.id))
    selectedExpenses.value = []
    toast.success('Expenses approved')
    await loadData()
  } catch (e) {
    toast.error(e.message)
  }
}

async function approveAdvances() {
  try {
    await advanceStore.approveAdvances(selectedAdvances.value.map(a => a.id))
    selectedAdvances.value = []
    toast.success('Advances approved')
    await loadData()
  } catch (e) {
    toast.error(e.message)
  }
}

async function deleteExpense(row) {
  if (!confirm('Delete this expense?')) return
  try {
    await expenseStore.deleteExpense(row.id)
    toast.success('Expense deleted')
    await loadData()
  } catch (e) { toast.error(e.message) }
}

async function deleteAdvance(row) {
  if (!confirm('Delete this advance?')) return
  try {
    await advanceStore.deleteAdvance(row.id)
    toast.success('Advance deleted')
    await loadData()
  } catch (e) { toast.error(e.message) }
}

async function doFinishTrip() {
  try {
    await tripStore.finishTrip(trip.value.id)
    toast.success('Trip finished')
    await loadData()
  } catch (e) {
    toast.error(e.message)
  }
}

async function loadData() {
  const id = route.params.id
  try {
    const data = await api.getTrip(id)
    trip.value = data.trip || data
    stats.value = data.stats || null
    expenses.value = data.expenses || []
    advances.value = data.advances || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await loadData()
  loading.value = false
})
</script>

<style scoped>
.loading-center { display: flex; justify-content: center; padding: var(--space-10); }

.trip-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.info-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.info-value { font-weight: 600; font-size: var(--font-size-base); }
.capitalize { text-transform: capitalize; }

.trip-description { border-top: 1px solid var(--color-border); padding-top: var(--space-3); }
.trip-description p { margin: 0; white-space: pre-wrap; }
.mt-3 { margin-top: var(--space-3); }

.mb-4 { margin-bottom: var(--space-4); }
.me-2 { margin-right: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.d-flex-center { display: flex; align-items: center; flex-wrap: wrap; }

.cursor-pointer { cursor: pointer; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-body-flush { padding: 0; }

.itinerary-section { margin-bottom: var(--space-4); }
.itinerary-section:last-child { margin-bottom: 0; }
.section-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: var(--space-2);
  display: flex; align-items: center; gap: var(--space-2);
}
.itinerary-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);
}

.bulk-actions {
  position: sticky;
  bottom: var(--space-4);
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: fit-content;
  margin: var(--space-2) auto;
  z-index: 50;
}
.bulk-count { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); }

.finish-section { margin-top: var(--space-6); }

.text-danger { color: var(--color-danger); }
.text-muted { color: var(--color-text-muted); }
.text-sm { font-size: var(--font-size-sm); }
</style>
