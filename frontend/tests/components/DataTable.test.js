import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DataTable from '@/components/common/DataTable.vue'

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status' }
]

const data = [
  { id: 1, name: 'Hotel', amount: 5000, status: 'pending' },
  { id: 2, name: 'Food', amount: 800, status: 'approved' },
  { id: 3, name: 'Transport', amount: 1200, status: 'pending' }
]

describe('DataTable', () => {
  it('renders all columns as headers', () => {
    const wrapper = mount(DataTable, { props: { columns, data } })
    const headers = wrapper.findAll('th')
    // 3 columns (no actions slot → no actions header)
    expect(headers.length).toBeGreaterThanOrEqual(3)
    expect(headers[0].text()).toContain('Name')
  })

  it('renders all data rows', () => {
    const wrapper = mount(DataTable, { props: { columns, data } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(3)
  })

  it('shows empty state when data is empty', () => {
    const wrapper = mount(DataTable, { props: { columns, data: [] } })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('shows loading state', () => {
    const wrapper = mount(DataTable, { props: { columns, data: [], loading: true } })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('emits row-click when a row is clicked', async () => {
    const wrapper = mount(DataTable, { props: { columns, data } })
    const rows = wrapper.findAll('tbody tr')
    await rows[1].trigger('click')
    expect(wrapper.emitted('row-click')?.[0][0]).toEqual(data[1])
  })

  it('renders selectable checkboxes when selectable is true', () => {
    const wrapper = mount(DataTable, {
      props: { columns, data, selectable: true, selected: [] }
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    // header checkbox + 3 row checkboxes
    expect(checkboxes.length).toBe(4)
  })

  it('selects rows via checkbox and emits update:selected', async () => {
    const wrapper = mount(DataTable, {
      props: { columns, data, selectable: true, selected: [] }
    })
    const checkboxes = wrapper.findAll('tbody input[type="checkbox"]')
    await checkboxes[0].setValue(true)
    expect(wrapper.emitted('update:selected')).toBeTruthy()
    // The emitted value should be an array of row objects
    const emitted = wrapper.emitted('update:selected')[0][0]
    expect(emitted.length).toBe(1)
    expect(emitted[0].id).toBe(1)
  })

  it('uses custom cell slot', () => {
    const wrapper = mount(DataTable, {
      props: { columns, data },
      slots: {
        'cell-status': ({ value }) => h('span', { class: 'custom-badge' }, value)
      }
    })
    const customs = wrapper.findAll('.custom-badge')
    expect(customs.length).toBe(3)
  })
})
