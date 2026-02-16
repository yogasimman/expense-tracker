import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCard from '@/components/common/StatCard.vue'

describe('StatCard', () => {
  it('renders value and label', () => {
    const wrapper = mount(StatCard, {
      props: { value: 42, label: 'Total Trips', icon: 'bi bi-airplane', color: 'primary' }
    })
    expect(wrapper.find('.stat-value').text()).toBe('42')
    expect(wrapper.find('.stat-label').text()).toBe('Total Trips')
  })

  it('renders string values', () => {
    const wrapper = mount(StatCard, {
      props: { value: '₹1,234', label: 'Amount', icon: 'bi bi-cash', color: 'success' }
    })
    expect(wrapper.find('.stat-value').text()).toBe('₹1,234')
  })

  it('applies color class', () => {
    const wrapper = mount(StatCard, {
      props: { value: 0, label: 'Test', icon: 'bi bi-x', color: 'danger' }
    })
    expect(wrapper.find('.stat-card').classes()).toContain('stat-danger')
  })
})
