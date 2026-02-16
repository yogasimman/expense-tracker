import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from '@/components/common/TabBar.vue'

describe('TabBar', () => {
  const tabs = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' }
  ]

  it('renders all tabs', () => {
    const wrapper = mount(TabBar, {
      props: { tabs, modelValue: '' }
    })
    const buttons = wrapper.findAll('.tab-item')
    expect(buttons.length).toBe(3)
    expect(buttons[0].text()).toBe('All')
    expect(buttons[1].text()).toBe('Pending')
    expect(buttons[2].text()).toBe('Approved')
  })

  it('marks the active tab', () => {
    const wrapper = mount(TabBar, {
      props: { tabs, modelValue: 'pending' }
    })
    const buttons = wrapper.findAll('.tab-item')
    expect(buttons[1].classes()).toContain('active')
    expect(buttons[0].classes()).not.toContain('active')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mount(TabBar, {
      props: { tabs, modelValue: '' }
    })
    await wrapper.findAll('.tab-item')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['approved'])
  })

  it('renders count badges when provided', () => {
    const tabsWithCount = [
      { value: '', label: 'All', count: 10 },
      { value: 'pending', label: 'Pending', count: 3 }
    ]
    const wrapper = mount(TabBar, {
      props: { tabs: tabsWithCount, modelValue: '' }
    })
    const badges = wrapper.findAll('.tab-count')
    expect(badges.length).toBe(2)
    expect(badges[0].text()).toBe('10')
  })
})
