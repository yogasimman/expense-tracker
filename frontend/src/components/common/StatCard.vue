<template>
  <div class="stat-card" :class="color && `stat-${color}`">
    <div class="stat-icon">
      <i :class="icon"></i>
    </div>
    <div class="stat-content">
      <span class="stat-value">{{ formattedValue }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  prefix: { type: String, default: '' },
  color: { type: String, default: 'primary' }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number' && props.prefix) {
    return `${props.prefix}${props.value.toLocaleString()}`
  }
  return props.value
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: box-shadow var(--transition-base);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-primary .stat-icon   { background: var(--color-primary-light); color: var(--color-primary); }
.stat-success .stat-icon   { background: var(--color-success-light); color: var(--color-success); }
.stat-warning .stat-icon   { background: var(--color-warning-light); color: var(--color-warning); }
.stat-danger .stat-icon    { background: var(--color-danger-light);  color: var(--color-danger); }
.stat-info .stat-icon      { background: var(--color-info-light);    color: var(--color-info); }

.stat-content {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}
.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
}
</style>
