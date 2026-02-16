<template>
  <div class="page-header">
    <div class="page-header-left">
      <h2 class="page-heading">
        <i v-if="icon" :class="icon"></i>
        {{ title }}
      </h2>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-header-right">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' }
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-heading {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.page-heading i {
  color: var(--color-primary);
}
.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}
.page-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .page-header { flex-direction: column; }
}
</style>
