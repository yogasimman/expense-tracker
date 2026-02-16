<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-brand" @click="$router.push('/app')">
      <i class="bi bi-wallet2"></i>
      <span class="brand-text">VY Expense</span>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item) }"
      >
        <i :class="item.icon"></i>
        <span class="nav-label">&nbsp;&nbsp;{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <a class="nav-item logout-btn" @click="handleLogout">
        <i class="bi bi-box-arrow-right"></i>
        <span class="nav-label">&nbsp;&nbsp;Logout</span>
      </a>
    </div>
  </aside>

  <!-- Mobile overlay -->
  <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isCollapsed = ref(false)
const mobileOpen = ref(false)

function isActive(item) {
  if (item.to === '/app') return route.path === '/app' || route.path === '/app/'
  return route.path.startsWith(item.to)
}

const navItems = [
  { to: '/app',          icon: 'bi bi-house-fill',       label: 'Home' },
  { to: '/app/trips',    icon: 'bi bi-airplane-fill',    label: 'Trip' },
  { to: '/app/expenses', icon: 'bi bi-cash-stack',       label: 'Expenses' },
  { to: '/app/reports',  icon: 'bi bi-card-checklist',   label: 'Reports' },
  { to: '/app/advances', icon: 'bi bi-credit-card',      label: 'Advances' },
  { to: '/app/approvals',icon: 'bi bi-check2-circle',    label: 'Approvals', admin: true },
  { to: '/app/analytics',icon: 'bi bi-bar-chart-fill',   label: 'Analytics' },
  { to: '/app/settings', icon: 'bi bi-gear-fill',        label: 'Settings' }
]

const visibleItems = computed(() =>
  navItems.filter(item => !item.admin || auth.isAdmin)
)

async function handleLogout() {
  await auth.logout()
  router.push('/app/login')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  background-color: #2c3e50;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-x: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.sidebar-brand i {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.brand-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 13px 20px;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.3s, transform 0.3s, color 0.2s;
}
.nav-item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
.nav-item:hover {
  background-color: #34495e;
  transform: translateX(5px);
  color: #fff;
}
.nav-item.active {
  background-color: var(--color-primary);
  color: #fff;
}

.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.08);
}

.logout-btn {
  color: #cbd5e1 !important;
}
.logout-btn:hover {
  background-color: #c0392b !important;
  color: #fff !important;
  transform: translateX(5px);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
}

@media (max-width: 1024px) {
  .nav-label { display: none; }
  .brand-text { display: none; }
  .sidebar { width: 72px; }
  .nav-item { justify-content: center; padding: 13px; }
  .nav-item i { width: auto; }
  .sidebar-brand { justify-content: center; }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 240px;
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
</style>
