<template>
  <div>
    <PageHeader title="Approvals" icon="bi bi-check2-circle" subtitle="Review and approve submissions" />

    <!-- Entity Tabs -->
    <div class="entity-tabs">
      <button v-for="e in entityTabs" :key="e.value" class="entity-tab" :class="{ active: activeEntity === e.value }" @click="activeEntity = e.value">
        <i :class="e.icon"></i> {{ e.label }}
      </button>
    </div>

    <TabBar v-model="activeStatus" :tabs="statusTabs" />

    <!-- Trips Table -->
    <template v-if="activeEntity === 'trips'">
      <DataTable
        :columns="tripColumns"
        :data="filteredTrips"
        :loading="tripsLoading"
        :selectable="activeStatus === 'pending'"
        :selectableFilter="row => row.status === 'pending'"
        @row-click="row => $router.push(`/app/trips/${row.id}`)"
        v-model:selected="selectedTrips"
      >
        <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
        <template #cell-travel_type="{ value }"><span class="capitalize">{{ value }}</span></template>
        <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
      </DataTable>

      <div v-if="selectedTrips.length" class="bulk-actions">
        <span class="bulk-count">{{ selectedTrips.length }} trip(s)</span>
        <button class="btn btn-success btn-sm" @click="approveTrips"><i class="bi bi-check-lg"></i> Approve</button>
        <button class="btn btn-danger btn-sm" @click="openReject('trip')"><i class="bi bi-x-lg"></i> Reject</button>
      </div>
    </template>

    <!-- Expenses Table -->
    <template v-if="activeEntity === 'expenses'">
      <DataTable
        :columns="expenseColumns"
        :data="filteredExpenses"
        :loading="expensesLoading"
        :selectable="activeStatus === 'pending'"
        :selectableFilter="row => row.status === 'pending'"
        v-model:selected="selectedExpenses"
      >
        <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
        <template #cell-amount="{ row }"><span class="amount">₹{{ Number(row.amount).toLocaleString('en-IN') }}</span></template>
        <template #cell-expense_date="{ value }">{{ formatDate(value) }}</template>
      </DataTable>

      <div v-if="selectedExpenses.length" class="bulk-actions">
        <span class="bulk-count">{{ selectedExpenses.length }} expense(s)</span>
        <button class="btn btn-success btn-sm" @click="approveExpenses"><i class="bi bi-check-lg"></i> Approve</button>
        <button class="btn btn-danger btn-sm" @click="openReject('expense')"><i class="bi bi-x-lg"></i> Reject</button>
      </div>
    </template>

    <!-- Advances Table -->
    <template v-if="activeEntity === 'advances'">
      <DataTable
        :columns="advanceColumns"
        :data="filteredAdvances"
        :loading="advancesLoading"
        :selectable="activeStatus === 'pending'"
        :selectableFilter="row => row.status === 'pending'"
        v-model:selected="selectedAdvances"
      >
        <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
        <template #cell-amount="{ row }"><span class="amount">₹{{ Number(row.amount).toLocaleString('en-IN') }}</span></template>
      </DataTable>

      <div v-if="selectedAdvances.length" class="bulk-actions">
        <span class="bulk-count">{{ selectedAdvances.length }} advance(s)</span>
        <button class="btn btn-success btn-sm" @click="approveAdvancesAction"><i class="bi bi-check-lg"></i> Approve</button>
        <button class="btn btn-danger btn-sm" @click="openReject('advance')"><i class="bi bi-x-lg"></i> Reject</button>
      </div>
    </template>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Reject Items" size="sm">
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
import { useTripsStore } from '@/stores/trips'
import { useExpensesStore } from '@/stores/expenses'
import { useAdvancesStore } from '@/stores/advances'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const tripStore = useTripsStore()
const expenseStore = useExpensesStore()
const advanceStore = useAdvancesStore()
const toast = useToast()

const activeEntity = ref('trips')
const activeStatus = ref('pending')
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectType = ref('')

const selectedTrips = ref([])
const selectedExpenses = ref([])
const selectedAdvances = ref([])

const tripsLoading = ref(false)
const expensesLoading = ref(false)
const advancesLoading = ref(false)

const entityTabs = [
  { value: 'trips', label: 'Trips', icon: 'bi bi-airplane' },
  { value: 'expenses', label: 'Expenses', icon: 'bi bi-receipt' },
  { value: 'advances', label: 'Advances', icon: 'bi bi-credit-card' }
]

const statusTabs = [
  { value: '', label: 'All', icon: 'bi bi-list-ul' },
  { value: 'pending', label: 'Pending', icon: 'bi bi-hourglass-split' },
  { value: 'approved', label: 'Approved', icon: 'bi bi-check-circle' },
  { value: 'rejected', label: 'Rejected', icon: 'bi bi-x-circle' },
  { value: 'finished', label: 'Finished', icon: 'bi bi-flag-fill' }
]

const tripColumns = [
  { key: 'trip_name', label: 'Trip Name', sortable: true },
  { key: 'travel_type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true }
]
const expenseColumns = [
  { key: 'expense_title', label: 'Title', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'category_name', label: 'Category' },
  { key: 'trip_name', label: 'Trip' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', sortable: true }
]
const advanceColumns = [
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'paid_through', label: 'Paid Through' },
  { key: 'reference', label: 'Reference' },
  { key: 'trip_name', label: 'Trip' },
  { key: 'status', label: 'Status', sortable: true }
]

const filteredTrips = computed(() => {
  if (!activeStatus.value) return tripStore.trips
  return tripStore.trips.filter(t => t.status === activeStatus.value)
})
const filteredExpenses = computed(() => {
  if (!activeStatus.value) return expenseStore.expenses
  return expenseStore.expenses.filter(e => e.status === activeStatus.value)
})
const filteredAdvances = computed(() => {
  if (!activeStatus.value) return advanceStore.advances
  return advanceStore.advances.filter(a => a.status === activeStatus.value)
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openReject(type) {
  rejectType.value = type
  rejectReason.value = ''
  showRejectModal.value = true
}

async function approveTrips() {
  try {
    for (const t of selectedTrips.value) {
      await tripStore.updateStatus(t.id, 'approved')
    }
    selectedTrips.value = []
    toast.success('Trips approved')
    tripStore.fetchTrips()
  } catch (e) { toast.error(e.message) }
}

async function approveExpenses() {
  try {
    await expenseStore.approveExpenses(selectedExpenses.value.map(e => e.id))
    selectedExpenses.value = []
    toast.success('Expenses approved')
    expenseStore.fetchExpenses()
  } catch (e) { toast.error(e.message) }
}

async function approveAdvancesAction() {
  try {
    await advanceStore.approveAdvances(selectedAdvances.value.map(a => a.id))
    selectedAdvances.value = []
    toast.success('Advances approved')
    advanceStore.fetchAdvances()
  } catch (e) { toast.error(e.message) }
}

async function doReject() {
  try {
    if (rejectType.value === 'trip') {
      for (const t of selectedTrips.value) {
        await tripStore.updateStatus(t.id, 'rejected')
      }
      selectedTrips.value = []
      tripStore.fetchTrips()
    } else if (rejectType.value === 'expense') {
      for (const e of selectedExpenses.value) {
        await expenseStore.rejectExpense(e.id, rejectReason.value)
      }
      selectedExpenses.value = []
      expenseStore.fetchExpenses()
    } else if (rejectType.value === 'advance') {
      for (const a of selectedAdvances.value) {
        await advanceStore.rejectAdvance(a.id, rejectReason.value)
      }
      selectedAdvances.value = []
      advanceStore.fetchAdvances()
    }
    showRejectModal.value = false
    toast.success('Items rejected')
  } catch (e) { toast.error(e.message) }
}

onMounted(async () => {
  tripsLoading.value = true
  expensesLoading.value = true
  advancesLoading.value = true
  await Promise.all([
    tripStore.fetchTrips().finally(() => tripsLoading.value = false),
    expenseStore.fetchExpenses().finally(() => expensesLoading.value = false),
    advanceStore.fetchAdvances().finally(() => advancesLoading.value = false)
  ])
})
</script>

<style scoped>
.entity-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.entity-tab {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer; font-size: var(--font-size-sm); font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}
.entity-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.entity-tab:hover:not(.active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.capitalize { text-transform: capitalize; }
.amount { font-weight: 600; font-family: var(--font-mono, monospace); }

.bulk-actions {
  position: fixed; bottom: var(--space-6); left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); z-index: 100;
}
.bulk-count { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); }
</style>
