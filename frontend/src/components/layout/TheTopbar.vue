<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="btn-ghost mobile-menu" @click="$emit('toggle-sidebar')">
        <i class="bi bi-list"></i>
      </button>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
    <div class="topbar-right">
      <div class="user-info">
        <div class="avatar">{{ initials }}</div>
        <div class="user-meta">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span class="user-role">{{ auth.user?.role }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits(['toggle-sidebar'])
const route = useRoute()
const auth = useAuthStore()

const pageTitle = computed(() => route.meta?.title || route.name || '')

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<style scoped>
.topbar {
  height: var(--topbar-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.user-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}
.user-role {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.mobile-menu {
  display: none;
  font-size: 1.4rem;
}

@media (max-width: 768px) {
  .mobile-menu { display: inline-flex; }
  .topbar { padding: 0 var(--space-4); }
  .user-meta { display: none; }
}
</style>
