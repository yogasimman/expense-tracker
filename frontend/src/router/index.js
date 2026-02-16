import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/app/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/app',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'trips', name: 'Trips', component: () => import('@/views/TripsView.vue') },
      { path: 'trips/new', name: 'NewTrip', component: () => import('@/views/NewTripView.vue') },
      { path: 'trips/:id', name: 'TripDetails', component: () => import('@/views/TripDetailsView.vue'), props: true },
      { path: 'expenses', name: 'Expenses', component: () => import('@/views/ExpensesView.vue') },
      { path: 'expenses/new', name: 'NewExpense', component: () => import('@/views/NewExpenseView.vue') },
      { path: 'advances', name: 'Advances', component: () => import('@/views/AdvancesView.vue') },
      { path: 'advances/new', name: 'NewAdvance', component: () => import('@/views/NewAdvanceView.vue') },
      { path: 'approvals', name: 'Approvals', component: () => import('@/views/ApprovalsView.vue'), meta: { adminOnly: true } },
      { path: 'analytics', name: 'Analytics', component: () => import('@/views/AnalyticsView.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/SettingsView.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/app' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.checked) {
    try { await auth.checkAuth() } catch { /* noop */ }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'Dashboard' }
  }
  if (to.meta.adminOnly && auth.user?.role !== 'admin') {
    return { name: 'Dashboard' }
  }
})

export default router
