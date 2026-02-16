<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.type}`" @click="remove(t.id)">
        <i :class="iconMap[t.type]"></i>
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const iconMap = {
  success: 'bi bi-check-circle-fill',
  error: 'bi bi-exclamation-circle-fill',
  info: 'bi bi-info-circle-fill'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  max-width: 400px;
}
.toast-success { background: var(--color-success); color: #fff; }
.toast-error   { background: var(--color-danger);  color: #fff; }
.toast-info    { background: var(--color-primary); color: #fff; }

.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from    { transform: translateX(100%); opacity: 0; }
.toast-leave-to      { transform: translateX(100%); opacity: 0; }
</style>
