import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/common/PageHeader.vue'

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'My Title', subtitle: 'My Sub' }
    })
    expect(wrapper.find('.page-heading').text()).toBe('My Title')
    expect(wrapper.find('.page-subtitle').text()).toBe('My Sub')
  })

  it('renders icon when provided', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Test', icon: 'bi bi-airplane-fill' }
    })
    expect(wrapper.find('.bi-airplane-fill').exists()).toBe(true)
  })

  it('renders slot content', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Test' },
      slots: { default: '<button class="action-btn">Action</button>' }
    })
    expect(wrapper.find('.action-btn').exists()).toBe(true)
  })
})
