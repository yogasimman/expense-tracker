import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '@/components/common/BaseModal.vue'

describe('BaseModal', () => {
  it('is hidden when modelValue is false', () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: false, title: 'Test' },
      global: { stubs: { teleport: true } }
    })
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('is visible when modelValue is true', () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true, title: 'My Modal' },
      global: { stubs: { teleport: true } }
    })
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('My Modal')
  })

  it('emits update:modelValue on close button click', async () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true, title: 'Test' },
      global: { stubs: { teleport: true } }
    })
    await wrapper.find('.modal-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('renders footer slot', () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true, title: 'Test' },
      slots: { footer: '<button class="test-footer">Save</button>' },
      global: { stubs: { teleport: true } }
    })
    expect(wrapper.find('.test-footer').exists()).toBe(true)
  })

  it('applies size class', () => {
    const wrapper = mount(BaseModal, {
      props: { modelValue: true, title: 'Test', size: 'lg' },
      global: { stubs: { teleport: true } }
    })
    expect(wrapper.find('.modal-dialog').classes()).toContain('modal-lg')
  })
})
