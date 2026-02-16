<template>
  <div>
    <PageHeader title="Analytics" icon="bi bi-bar-chart-fill" subtitle="Insights into your expenses and trips" />

    <!-- Admin Toggle -->
    <div v-if="auth.isAdmin" class="scope-toggle mb-4">
      <button :class="['btn btn-sm', scope === 'my' ? 'btn-primary' : 'btn-outline']" @click="switchScope('my')">My Analytics</button>
      <button :class="['btn btn-sm', scope === 'global' ? 'btn-primary' : 'btn-outline']" @click="switchScope('global')">Global Analytics</button>
    </div>

    <div class="stats-grid">
      <StatCard icon="bi bi-airplane-fill" label="Total Trips" :value="stats.totalTrips || 0" color="primary" />
      <StatCard icon="bi bi-receipt-cutoff" label="Total Expenses" :value="stats.totalExpenses || 0" color="success" />
      <StatCard icon="bi bi-cash-stack" label="Total Spent" :value="'₹' + Number(stats.totalExpenseAmount || 0).toLocaleString('en-IN')" color="warning" />
      <StatCard icon="bi bi-credit-card-fill" label="Total Advanced" :value="'₹' + Number(stats.totalAdvanceAmount || 0).toLocaleString('en-IN')" color="danger" />
    </div>

    <div class="charts-grid mt-6">
      <div class="card">
        <div class="card-header"><span class="card-title">Expenses by Status</span></div>
        <div class="card-body chart-body">
          <canvas ref="expenseStatusChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Trips by Type</span></div>
        <div class="card-body chart-body">
          <canvas ref="tripTypeChart"></canvas>
        </div>
      </div>
    </div>

    <div class="charts-grid mt-4">
      <div class="card">
        <div class="card-header"><span class="card-title">Trips by Status</span></div>
        <div class="card-body chart-body">
          <canvas ref="tripStatusChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Advances by Status</span></div>
        <div class="card-body chart-body">
          <canvas ref="advanceStatusChart"></canvas>
        </div>
      </div>
    </div>

    <div class="charts-grid mt-4">
      <div class="card">
        <div class="card-header"><span class="card-title">Expenses by Category</span></div>
        <div class="card-body chart-body">
          <canvas ref="categoryChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Advances by Currency</span></div>
        <div class="card-body chart-body">
          <canvas ref="currencyChart"></canvas>
        </div>
      </div>
    </div>

    <div class="charts-grid mt-4">
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-header"><span class="card-title">Monthly Expense Trend</span></div>
        <div class="card-body chart-body-wide">
          <canvas ref="trendChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'

const auth = useAuthStore()
const stats = ref({})
const analyticsData = ref({})
const scope = ref('my') // 'my' or 'global'

// Chart refs
const expenseStatusChart = ref(null)
const tripTypeChart = ref(null)
const tripStatusChart = ref(null)
const advanceStatusChart = ref(null)
const categoryChart = ref(null)
const currencyChart = ref(null)
const trendChart = ref(null)

// Store chart instances for cleanup
const chartInstances = ref([])
let Chart = null

function destroyCharts() {
  chartInstances.value.forEach(c => c.destroy())
  chartInstances.value = []
}

function makeChart(canvasRef, config) {
  if (!canvasRef || !Chart) return null
  const inst = new Chart(canvasRef, config)
  chartInstances.value.push(inst)
  return inst
}

async function loadData() {
  const [dashData, analytics] = await Promise.all([
    api.getDashboard(),
    api.getAnalytics()
  ])
  stats.value = dashData.stats || dashData || {}
  analyticsData.value = analytics || {}
}

function getAnalyticsForScope() {
  const data = analyticsData.value
  if (scope.value === 'global' && data.overall) {
    return {
      expenseCategories: data.overall.expenseCategories || [],
      expenseAmounts: data.overall.expenseAmounts || [],
      tripCounts: data.overall.tripCounts || [0, 0, 0],
      advanceLabels: data.overall.advanceLabels || [],
      advanceAmounts: data.overall.advanceAmounts || []
    }
  }
  return {
    expenseCategories: data.expenseCategories || [],
    expenseAmounts: data.expenseAmounts || [],
    tripCounts: data.tripCounts || [0, 0, 0],
    advanceLabels: data.advanceLabels || [],
    advanceAmounts: data.advanceAmounts || []
  }
}

function renderCharts() {
  destroyCharts()
  const s = stats.value
  const a = getAnalyticsForScope()

  // Expense Status Doughnut
  makeChart(expenseStatusChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{ data: [s.pendingExpenses || 0, s.approvedExpenses || 0, s.rejectedExpenses || 0], backgroundColor: ['#D97706', '#059669', '#DC2626'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  })

  // Trip Type Doughnut
  makeChart(tripTypeChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Local', 'Domestic', 'International'],
      datasets: [{ data: a.tripCounts, backgroundColor: ['#4F46E5', '#0891B2', '#7C3AED'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  })

  // Trip Status Doughnut
  makeChart(tripStatusChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Approved', 'Rejected', 'Finished'],
      datasets: [{ data: [s.pendingTrips || 0, s.approvedTrips || 0, s.rejectedTrips || 0, s.finishedTrips || 0], backgroundColor: ['#D97706', '#059669', '#DC2626', '#4F46E5'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  })

  // Advance Status Doughnut
  makeChart(advanceStatusChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{ data: [s.pendingAdvances || 0, s.approvedAdvances || 0, s.rejectedAdvances || 0], backgroundColor: ['#D97706', '#059669', '#DC2626'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  })

  // Expenses by Category Bar
  if (a.expenseCategories.length) {
    makeChart(categoryChart.value, {
      type: 'bar',
      data: {
        labels: a.expenseCategories,
        datasets: [{ label: 'Amount (₹)', data: a.expenseAmounts, backgroundColor: '#4F46E5', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E2E8F0' } }, x: { grid: { display: false } } } }
    })
  }

  // Advances by Currency Bar
  if (a.advanceLabels.length) {
    makeChart(currencyChart.value, {
      type: 'bar',
      data: {
        labels: a.advanceLabels,
        datasets: [{ label: 'Amount (₹)', data: a.advanceAmounts, backgroundColor: '#0891B2', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E2E8F0' } }, x: { grid: { display: false } } } }
    })
  }

  // Monthly Trend Bar
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  makeChart(trendChart.value, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'Expenses (₹)', data: s.monthlyTrend || months.map(() => 0), backgroundColor: '#4F46E5', borderRadius: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E2E8F0' } }, x: { grid: { display: false } } } }
  })
}

async function switchScope(newScope) {
  scope.value = newScope
  await nextTick()
  renderCharts()
}

onMounted(async () => {
  try {
    const chartModule = await import('chart.js')
    Chart = chartModule.Chart
    Chart.register(...chartModule.registerables)
    await loadData()
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('Error loading analytics:', e)
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
@media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }

.chart-body { height: 280px; display: flex; align-items: center; justify-content: center; }
.chart-body-wide { height: 300px; }
.mt-6 { margin-top: var(--space-6); }
.mt-4 { margin-top: var(--space-4); }
.mb-4 { margin-bottom: var(--space-4); }

.scope-toggle {
  display: flex;
  gap: var(--space-2);
}
</style>
