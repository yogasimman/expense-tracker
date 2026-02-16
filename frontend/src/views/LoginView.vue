<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <i class="bi bi-wallet2"></i>
        <h1>VY Expense</h1>
        <p>Sign in to manage your expenses</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMsg" class="form-alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          {{ errorMsg }}
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <div class="input-icon">
            <i class="bi bi-envelope"></i>
            <input id="email" v-model="email" type="email" class="form-input" placeholder="you@company.com" required autofocus />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-icon">
            <i class="bi bi-lock"></i>
            <input id="password" v-model="password" type="password" class="form-input" placeholder="Enter your password" required />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner spinner-sm"></span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/app')
  } catch (e) {
    errorMsg.value = e.message || 'Invalid credentials'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--space-4);
}

.login-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-10);
  width: 100%;
  max-width: 420px;
}

.login-brand {
  text-align: center;
  margin-bottom: var(--space-8);
}
.login-brand i {
  font-size: 2.5rem;
  color: var(--color-primary);
}
.login-brand h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-top: var(--space-2);
}
.login-brand p {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-top: var(--space-1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.input-icon {
  position: relative;
}
.input-icon i {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 1rem;
}
.input-icon .form-input {
  padding-left: 40px;
}

.btn-block {
  width: 100%;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
}

.form-alert {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border-width: 2px;
}
</style>
