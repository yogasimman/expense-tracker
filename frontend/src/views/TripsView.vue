<template>
  <div>
    <PageHeader title="Trips" icon="bi bi-airplane-fill" subtitle="Manage your business trips">
      <router-link to="/app/trips/new" class="btn btn-primary">
        <i class="bi bi-plus-lg"></i> New Trip
      </router-link>
    </PageHeader>

    <TabBar v-model="activeTab" :tabs="tabs" />

    <!-- Trips Table -->
    <div class="table-card">
      <div v-if="tripStore.loading" class="loading-center">
        <div class="spinner"></div>
      </div>
      <table v-else-if="filteredTrips.length" class="trips-table">
        <thead>
          <tr>
            <th v-if="auth.isAdmin && activeTab === 'pending'" class="col-check">
              <input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll" />
            </th>
            <th>Submitter</th>
            <th>Trip Name</th>
            <th>Travel Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trip in filteredTrips"
            :key="trip.id"
            @click="openTrip(trip)"
            class="trip-row"
          >
            <td v-if="auth.isAdmin && activeTab === 'pending'" class="col-check" @click.stop>
              <input
                type="checkbox"
                :checked="isSelected(trip)"
                @change="toggleRow(trip)"
                :disabled="trip.status !== 'pending'"
              />
            </td>
            <td>{{ trip.user_name || trip.submitter || 'N/A' }}</td>
            <td class="fw-500">{{ trip.trip_name || trip.tripName || 'N/A' }}</td>
            <td class="capitalize">{{ trip.travel_type || trip.travelType || 'N/A' }}</td>
            <td>
              <span class="status-pill" :class="statusClass(trip.status)">
                {{ trip.status || 'N/A' }}
              </span>
            </td>
            <td class="text-muted">{{ formatDate(trip.created_at) }}</td>
            <td @click.stop>
              <div class="row-actions">
                <router-link :to="`/app/trips/${trip.id}`" class="btn btn-ghost btn-sm">
                  <i class="bi bi-eye"></i>
                </router-link>
                <button
                  v-if="trip.status === 'pending' && !auth.isAdmin"
                  class="btn btn-ghost btn-sm text-danger"
                  @click.stop="confirmDelete(trip)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <i class="bi bi-inbox"></i>
        <p>No trips found</p>
      </div>
    </div>

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
    <BaseModal v-model="showRejectModal" title="Reject Trips" size="sm">
      <div class="form-group">
        <label class="form-label">Reason for rejection</label>
        <textarea v-model="rejectReason" class="form-input" rows="3" placeholder="Enter reason..."></textarea>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showRejectModal = false">Cancel</button>
        <button class="btn btn-danger" @click="bulkReject" :disabled="!rejectReason.trim()">Reject</button>
      </template>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Trip" size="sm">
      <p>Are you sure you want to delete <strong>{{ tripToDelete?.trip_name }}</strong>? This will also remove associated expenses and advances.</p>
      <template #footer>
        <button class="btn btn-outline" @click="showDeleteModal = false">Cancel</button>
        <button class="btn btn-danger" @click="doDelete">Delete</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const router = useRouter()
const tripStore = useTripsStore()
const auth = useAuthStore()
const toast = useToast()

const activeTab = ref('')
const selected = ref([])
const showRejectModal = ref(false)
const showDeleteModal = ref(false)
const rejectReason = ref('')
const tripToDelete = ref(null)

const tabs = [
  { value: '', label: 'All', icon: 'bi bi-list-ul' },
  { value: 'pending', label: 'Pending', icon: 'bi bi-hourglass-split' },
  { value: 'approved', label: 'Approved', icon: 'bi bi-check-circle' },
  { value: 'rejected', label: 'Rejected', icon: 'bi bi-x-circle' },
  { value: 'finished', label: 'Finished', icon: 'bi bi-flag-fill' }
]

const filteredTrips = computed(() => {
  if (!activeTab.value) return tripStore.trips
  return tripStore.trips.filter(t => t.status === activeTab.value)
})

// Selection helpers
const selectedIds = computed(() => new Set(selected.value.map(r => r.id)))
const selectableRows = computed(() => filteredTrips.value.filter(t => t.status === 'pending'))
const allSelected = computed(() => selectableRows.value.length > 0 && selectableRows.value.every(r => selectedIds.value.has(r.id)))
const someSelected = computed(() => {
  const s = selectableRows.value.filter(r => selectedIds.value.has(r.id))
  return s.length > 0 && s.length < selectableRows.value.length
})

function isSelected(row) { return selectedIds.value.has(row.id) }
function toggleRow(row) {
  if (isSelected(row)) {
    selected.value = selected.value.filter(r => r.id !== row.id)
  } else {
    selected.value = [...selected.value, row]
  }
}
function toggleAll() {
  if (allSelected.value) {
    selected.value = []
  } else {
    selected.value = [...selectableRows.value]
  }
}

function statusClass(status) {
  if (!status) return 'status-pending'
  const s = status.toLowerCase()
  if (s === 'approved') return 'status-approved'
  if (s === 'rejected') return 'status-rejected'
  if (s === 'finished') return 'status-finished'
  return 'status-pending'
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openTrip(trip) {
  router.push(`/app/trips/${trip.id}`)
}

function confirmDelete(trip) {
  tripToDelete.value = trip
  showDeleteModal.value = true
}

async function doDelete() {
  try {
    await tripStore.deleteTrip(tripToDelete.value.id)
    showDeleteModal.value = false
    toast.success('Trip deleted')
  } catch (e) {
    toast.error(e.message)
  }
}

async function bulkApprove() {
  try {
    for (const trip of selected.value) {
      await tripStore.updateStatus(trip.id, 'approved')
    }
    selected.value = []
    toast.success('Trips approved')
    tripStore.fetchTrips()
  } catch (e) {
    toast.error(e.message)
  }
}

async function bulkReject() {
  try {
    for (const trip of selected.value) {
      await tripStore.updateStatus(trip.id, 'rejected')
    }
    selected.value = []
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Trips rejected')
    tripStore.fetchTrips()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(() => {
  tripStore.fetchTrips()
})
</script>

<style scoped>
/* Table Card */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

/* Table */
.trips-table {
  width: 100%;
  border-collapse: collapse;
}
.trips-table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover);
  white-space: nowrap;
}
.trips-table td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  vertical-align: middle;
}
.trips-table tbody tr:last-child td {
  border-bottom: none;
}
.trip-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}
.trip-row:hover {
  background: var(--color-surface-hover);
}
.col-check {
  width: 40px;
  text-align: center;
}
.col-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* Status pills — colored rounded badges */
.status-pill {
  display: inline-block;
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-full);
  text-transform: capitalize;
  font-weight: 500;
}
.status-approved {
  background: var(--color-success-light);
  color: var(--color-success);
}
.status-pending {
  background: var(--color-warning-light);
  color: var(--color-warning);
}
.status-rejected {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
.status-finished {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.fw-500 { font-weight: 500; }
.capitalize { text-transform: capitalize; }
.text-muted { color: var(--color-text-muted); }
.text-danger { color: var(--color-danger); }
.row-actions { display: flex; gap: var(--space-1); }

.loading-center {
  display: flex;
  justify-content: center;
  padding: var(--space-10);
}

.bulk-actions {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.bulk-count {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}
</style>
