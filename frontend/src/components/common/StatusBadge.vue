<template>
  <span class="status-badge" :class="statusClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const statusClass = computed(() => `status-${props.status.toLowerCase()}`)
const label = computed(() => props.status.charAt(0).toUpperCase() + props.status.slice(1))
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;
}
.status-pending  { background: var(--color-warning-light); color: var(--color-warning); }
.status-approved { background: var(--color-success-light); color: var(--color-success); }
.status-rejected { background: var(--color-danger-light);  color: var(--color-danger); }
.status-finished { background: var(--color-info-light);    color: var(--color-info); }
.status-submitted { background: var(--color-primary-50);   color: var(--color-primary); }
.status-draft    { background: var(--color-border-light);  color: var(--color-text-muted); }
</style>
