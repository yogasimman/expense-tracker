<template>
  <div>
    <PageHeader title="Analytics" icon="bi bi-bar-chart-fill" subtitle="Insights into your expenses and trips" />

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
          <canvas ref="statusChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Trips by Type</span></div>
        <div class="card-body chart-body">
          <canvas ref="typeChart"></canvas>
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
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'

const stats = ref({})
const statusChart = ref(null)
const typeChart = ref(null)
const trendChart = ref(null)

async function loadCharts() {
  // Dynamically import Chart.js to avoid bundle bloat if not needed
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  // Status Doughnut
  if (statusChart.value) {
    new Chart(statusChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          data: [
            stats.value.pendingExpenses || 0,
            stats.value.approvedExpenses || 0,
            stats.value.rejectedExpenses || 0
          ],
          backgroundColor: ['#D97706', '#059669', '#DC2626'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    })
  }

  // Trip Type Doughnut
  if (typeChart.value) {
    new Chart(typeChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Local', 'Domestic', 'International'],
        datasets: [{
          data: [
            stats.value.localTrips || 0,
            stats.value.domesticTrips || 0,
            stats.value.internationalTrips || 0
          ],
          backgroundColor: ['#4F46E5', '#0891B2', '#7C3AED'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    })
  }

  // Trend Bar — placeholder with current month
  if (trendChart.value) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const data = stats.value.monthlyTrend || months.map(() => 0)
    new Chart(trendChart.value, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Expenses (₹)',
          data,
          backgroundColor: '#4F46E5',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#E2E8F0' } },
          x: { grid: { display: false } }
        }
      }
    })
  }
}

onMounted(async () => {
  try {
    const data = await api.getDashboard()
    stats.value = data.stats || data || {}
  } catch (e) { console.error(e) }
  await nextTick()
  loadCharts()
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
</style>
