import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'

// Mock the auth store
vi.mock('@/api', () => ({
  api: {
    login: vi.fn(),
    me: vi.fn()
  }
}))

import { api } from '@/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/app/login', component: LoginView },
    { path: '/app', component: { template: '<div>Dashboard</div>' } }
  ]
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('renders brand name', () => {
    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })
    expect(wrapper.text()).toContain('Expense')
  })

  it('disables button while loading', async () => {
    // Make login hang
    api.login.mockImplementation(() => new Promise(() => {}))

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })

    await wrapper.find('input[type="email"]').setValue('test@test.com')
    await wrapper.find('input[type="password"]').setValue('password')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('shows error on failed login', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'))

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })

    await wrapper.find('input[type="email"]').setValue('bad@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')

    // Wait for async operations
    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Invalid credentials')
  })
})
