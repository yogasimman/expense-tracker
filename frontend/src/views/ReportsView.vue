<template>
  <div>
    <PageHeader title="Reports" icon="bi bi-file-earmark-text-fill" subtitle="Generate and view expense reports">
      <button class="btn btn-primary" @click="showCreateModal = true">
        <i class="bi bi-plus-lg"></i> New Report
      </button>
    </PageHeader>

    <TabBar v-model="activeTab" :tabs="tabs" />

    <DataTable
      :columns="columns"
      :data="filteredReports"
      :loading="loading"
    >
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
    </DataTable>

    <!-- Create Report Modal -->
    <BaseModal v-model="showCreateModal" title="Generate Report" size="md">
      <div class="form-group">
        <label class="form-label">Report Name *</label>
        <input v-model="newReport.reportName" type="text" class="form-input" placeholder="e.g. Q4 Expense Summary" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Trip</label>
          <select v-model="newReport.tripId" class="form-input">
            <option value="">All trips</option>
            <option v-for="t in trips" :key="t.id" :value="t.id">{{ t.tripName || t.trip_name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status Filter</label>
          <select v-model="newReport.statusFilter" class="form-input">
            <option value="">All</option>
            <option value="approved">Approved only</option>
            <option value="pending">Pending only</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-outline" @click="showCreateModal = false">Cancel</button>
        <button class="btn btn-primary" @click="createReport" :disabled="!newReport.reportName.trim()">Generate</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/api'
import { useTripsStore } from '@/stores/trips'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'
import TabBar from '@/components/common/TabBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const tripStore = useTripsStore()
const toast = useToast()
const loading = ref(true)
const reports = ref([])
const trips = ref([])
const activeTab = ref('')
const showCreateModal = ref(false)

const newReport = reactive({ reportName: '', tripId: '', statusFilter: '' })

const tabs = [
  { value: '', label: 'All', icon: 'bi bi-list-ul' },
  { value: 'submitted', label: 'Submitted', icon: 'bi bi-send' },
  { value: 'approved', label: 'Approved', icon: 'bi bi-check-circle' },
  { value: 'rejected', label: 'Rejected', icon: 'bi bi-x-circle' }
]

const columns = [
  { key: 'report_name', label: 'Report Name', sortable: true },
  { key: 'trip_name', label: 'Trip' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true }
]

const filteredReports = computed(() => {
  if (!activeTab.value) return reports.value
  return reports.value.filter(r => r.status === activeTab.value)
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function createReport() {
  try {
    await api.createReport({
      reportName: newReport.reportName,
      tripId: newReport.tripId || undefined,
      statusFilter: newReport.statusFilter || undefined
    })
    showCreateModal.value = false
    newReport.reportName = ''
    newReport.tripId = ''
    newReport.statusFilter = ''
    toast.success('Report generated')
    await loadReports()
  } catch (e) { toast.error(e.message) }
}

async function loadReports() {
  try {
    reports.value = await api.getReports()
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await Promise.all([
    loadReports(),
    tripStore.fetchTrips()
  ])
  trips.value = tripStore.trips
  loading.value = false
})
</script>

<style scoped>
.grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
}
@media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
