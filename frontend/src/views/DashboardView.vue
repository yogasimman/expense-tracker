<template>
  <div>
    <PageHeader title="Dashboard" icon="bi bi-grid-1x2-fill" :subtitle="`Welcome back, ${auth.user?.name || 'User'}`" />

    <!-- Stats Grid -->
    <div class="stats-grid">
      <StatCard icon="bi bi-airplane-fill" label="Total Trips" :value="stats.totalTrips" color="primary" />
      <StatCard icon="bi bi-receipt-cutoff" label="Total Expenses" :value="stats.totalExpenses" color="success" />
      <StatCard icon="bi bi-credit-card-fill" label="Total Advances" :value="stats.totalAdvances" color="warning" />
      <StatCard icon="bi bi-hourglass-split" label="Pending Approval" :value="stats.pendingTrips + stats.pendingExpenses + stats.pendingAdvances" color="danger" />
    </div>

    <!-- Amount Cards -->
    <div class="amount-grid mt-6">
      <div class="card">
        <div class="card-body">
          <div class="amount-card">
            <div>
              <p class="text-muted text-sm">Total Expense Amount</p>
              <p class="amount-value">₹{{ (stats.totalExpenseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</p>
            </div>
            <div class="amount-icon success"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="amount-card">
            <div>
              <p class="text-muted text-sm">Total Advance Amount</p>
              <p class="amount-value">₹{{ (stats.totalAdvanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</p>
            </div>
            <div class="amount-icon warning"><i class="bi bi-credit-card"></i></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions + Recent -->
    <div class="dashboard-grid mt-6">
      <div class="card">
        <div class="card-header"><span class="card-title">Quick Actions</span></div>
        <div class="card-body">
          <div class="quick-actions">
            <router-link to="/app/trips/new" class="quick-action">
              <i class="bi bi-airplane"></i>
              <span>New Trip</span>
            </router-link>
            <router-link to="/app/expenses/new" class="quick-action">
              <i class="bi bi-receipt"></i>
              <span>New Expense</span>
            </router-link>
            <router-link to="/app/advances/new" class="quick-action">
              <i class="bi bi-credit-card-2-front"></i>
              <span>New Advance</span>
            </router-link>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Recent Trips</span></div>
        <div class="card-body card-body-compact">
          <div v-if="!recent.length" class="empty-state"><p>No trips yet</p></div>
          <div v-else class="recent-list">
            <router-link v-for="trip in recent" :key="trip.id" :to="`/app/trips/${trip.id}`" class="recent-item">
              <div>
                <span class="recent-name">{{ trip.trip_name }}</span>
                <span class="recent-meta">{{ trip.travel_type }}</span>
              </div>
              <StatusBadge :status="trip.status" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const auth = useAuthStore()
const stats = ref({})
const recent = ref([])

onMounted(async () => {
  try {
    const data = await api.getDashboard()
    stats.value = data.stats || {}
    recent.value = data.recentTrips || []
  } catch (e) {
    console.error('Dashboard load error:', e)
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.amount-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.amount-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-top: var(--space-1);
}
.amount-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
}
.amount-icon.success { background: var(--color-success-light); color: var(--color-success); }
.amount-icon.warning { background: var(--color-warning-light); color: var(--color-warning); }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  text-decoration: none;
}
.quick-action i {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.quick-action:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.card-body-compact { padding: 0; }

.recent-list {
  display: flex;
  flex-direction: column;
}
.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  text-decoration: none;
  transition: background var(--transition-fast);
}
.recent-item:last-child { border-bottom: none; }
.recent-item:hover { background: var(--color-surface-hover); }

.recent-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  display: block;
}
.recent-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}
</style>
