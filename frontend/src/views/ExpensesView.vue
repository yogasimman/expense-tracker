<template>
  <div>
    <PageHeader title="Expenses" icon="bi bi-receipt-cutoff" subtitle="Track and manage expenses">
      <router-link to="/app/expenses/new" class="btn btn-primary">
        <i class="bi bi-plus-lg"></i> New Expense
      </router-link>
    </PageHeader>

    <TabBar v-model="activeTab" :tabs="tabs" />

    <DataTable
      :columns="columns"
      :data="filteredExpenses"
      :loading="expenseStore.loading"
      :selectable="auth.isAdmin && activeTab === 'pending'"
      :selectableFilter="row => row.status === 'pending'"
      v-model:selected="selected"
    >
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>

      <template #cell-amount="{ row }">
        <span class="amount">₹{{ Number(row.amount).toLocaleString('en-IN') }}</span>
      </template>

      <template #cell-date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <div class="row-actions">
          <button
            v-if="row.status === 'pending' && !auth.isAdmin"
            class="btn btn-ghost btn-sm text-danger"
            @click.stop="confirmDelete(row)"
          >
            <i class="bi bi-trash"></i>
          </button>
          <button
            v-if="auth.isAdmin && row.status === 'pending'"
            class="btn btn-ghost btn-sm text-danger"
            @click.stop="openReject(row)"
          >
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Admin Bulk Actions -->
    <div v-if="auth.isAdmin && selected.length" class="bulk-actions">
      <span class="bulk-count">{{ selected.length }} selected</span>
      <button class="btn btn-success btn-sm" @click="bulkApprove">
        <i class="bi bi-check-lg"></i> Approve
      </button>
      <button class="btn btn-danger btn-sm" @click="showRejectModal = true">
        <i class="bi bi-x-lg"></i> Reject
      </button>
    </div>

    <!-- Reject Modal -->
    <BaseModal v-model="showRejectModal" title="Reject Expense" size="sm">
      <div class="form-group">
        <label class="form-label">Reason for rejection</label>
        <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Enter reason..."></textarea>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showRejectModal = false">Cancel</button>
        <button class="btn btn-danger" @click="doReject" :disabled="!rejectReason.trim()">Reject</button>
      </template>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Expense" size="sm">
      <p>Are you sure you want to delete <strong>{{ itemToDelete?.title }}</strong>?</p>
      <template #footer>
        <button class="btn btn-outline" @click="showDeleteModal = false">Cancel</button>
        <button class="btn btn-danger" @click="doDelete">Delete</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExpensesStore } from '@/stores/expenses'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const expenseStore = useExpensesStore()
const auth = useAuthStore()
const toast = useToast()

const activeTab = ref('')
const selected = ref([])
const showRejectModal = ref(false)
const showDeleteModal = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null)
const itemToDelete = ref(null)

const tabs = [
  { value: '', label: 'All', icon: 'bi bi-list-ul' },
  { value: 'pending', label: 'Pending', icon: 'bi bi-hourglass-split' },
  { value: 'approved', label: 'Approved', icon: 'bi bi-check-circle' },
  { value: 'rejected', label: 'Rejected', icon: 'bi bi-x-circle' }
]

const columns = [
  { key: 'expense_title', label: 'Title', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'category_name', label: 'Category', sortable: true },
  { key: 'trip_name', label: 'Trip' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'date', label: 'Date', sortable: true }
]

const filteredExpenses = computed(() => {
  if (!activeTab.value) return expenseStore.expenses
  return expenseStore.expenses.filter(e => e.status === activeTab.value)
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function confirmDelete(item) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function openReject(item) {
  rejectTarget.value = item
  rejectReason.value = ''
  showRejectModal.value = true
}

async function doDelete() {
  try {
    await expenseStore.deleteExpense(itemToDelete.value.id)
    showDeleteModal.value = false
    toast.success('Expense deleted')
  } catch (e) { toast.error(e.message) }
}

async function bulkApprove() {
  try {
    await expenseStore.approveExpenses(selected.value.map(e => e.id))
    selected.value = []
    toast.success('Expenses approved')
    expenseStore.fetchExpenses()
  } catch (e) { toast.error(e.message) }
}

async function doReject() {
  try {
    if (rejectTarget.value) {
      await expenseStore.rejectExpense(rejectTarget.value.id, rejectReason.value)
    } else {
      for (const e of selected.value) {
        await expenseStore.rejectExpense(e.id, rejectReason.value)
      }
      selected.value = []
    }
    showRejectModal.value = false
    rejectTarget.value = null
    rejectReason.value = ''
    toast.success('Expense(s) rejected')
    expenseStore.fetchExpenses()
  } catch (e) { toast.error(e.message) }
}

onMounted(() => expenseStore.fetchExpenses())
</script>

<style scoped>
.amount { font-weight: 600; font-family: var(--font-mono, monospace); }
.row-actions { display: flex; gap: var(--space-1); }
.text-danger { color: var(--color-danger); }

.bulk-actions {
  position: fixed; bottom: var(--space-6); left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); z-index: 100;
}
.bulk-count { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); }
</style>
