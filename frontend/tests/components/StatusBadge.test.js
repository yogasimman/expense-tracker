import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/common/StatusBadge.vue'

describe('StatusBadge', () => {
  it('renders with pending status (capitalized)', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'pending' } })
    expect(wrapper.text()).toBe('Pending')
    expect(wrapper.find('.status-badge').classes()).toContain('status-pending')
  })

  it('renders with approved status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'approved' } })
    expect(wrapper.text()).toBe('Approved')
    expect(wrapper.find('.status-badge').classes()).toContain('status-approved')
  })

  it('renders with rejected status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'rejected' } })
    expect(wrapper.text()).toBe('Rejected')
    expect(wrapper.find('.status-badge').classes()).toContain('status-rejected')
  })

  it('renders with finished status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'finished' } })
    expect(wrapper.text()).toBe('Finished')
    expect(wrapper.find('.status-badge').classes()).toContain('status-finished')
  })

  it('handles unknown status gracefully', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'unknown' } })
    expect(wrapper.text()).toBe('Unknown')
    expect(wrapper.find('.status-badge').classes()).toContain('status-unknown')
  })
})
