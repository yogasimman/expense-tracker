<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-item"
      :class="{ active: modelValue === tab.value }"
      @click="$emit('update:modelValue', tab.value)"
    >
      <i v-if="tab.icon" :class="tab.icon"></i>
      {{ tab.label }}
      <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.tab-bar {
  display: flex;
  gap: 2px;
  background: var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 3px;
  overflow-x: auto;
}
.tab-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.tab-item i {
  font-size: 0.9em;
}
.tab-item:hover {
  color: var(--color-text);
  background: rgba(255,255,255,0.6);
}
.tab-item.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-xs);
}
.tab-count {
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: 0 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}
.tab-item.active .tab-count {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
</style>
