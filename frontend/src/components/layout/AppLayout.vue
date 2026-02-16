<template>
  <div class="app-layout">
    <TheSidebar />
    <div class="app-main">
      <TheTopbar />
      <main class="page-content">
        <router-view />
      </main>
    </div>
    <ToastList />
  </div>
</template>

<script setup>
import TheSidebar from './TheSidebar.vue'
import TheTopbar from './TheTopbar.vue'
import ToastList from '../common/ToastList.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.app-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition-slow);
}
.page-content {
  flex: 1;
  padding: var(--space-8);
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .app-main {
    margin-left: 0;
  }
}
</style>
