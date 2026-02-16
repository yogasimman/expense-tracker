<template>
  <div class="data-table-wrapper">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th v-if="selectable" class="col-checkbox">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" :indeterminate="someSelected" />
            </th>
            <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">
              {{ col.label }}
            </th>
            <th v-if="$slots.actions" class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="totalCols" class="cell-center">
              <div class="loading-overlay"><div class="spinner"></div></div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="totalCols">
              <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>{{ emptyText }}</p>
              </div>
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="{ 'row-selected': isSelected(row) }"
              @click="handleRowClick(row)"
              style="cursor: pointer"
            >
              <td v-if="selectable" class="col-checkbox" @click.stop>
                <input
                  type="checkbox"
                  :checked="isSelected(row)"
                  @change="toggleRow(row)"
                  :disabled="selectableFilter && !selectableFilter(row)"
                />
              </td>
              <td v-for="col in columns" :key="col.key">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ formatValue(row[col.key], col) }}
                </slot>
              </td>
              <td v-if="$slots.actions" class="col-actions" @click.stop>
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selectableFilter: { type: Function, default: null },
  selected: { type: Array, default: () => [] },
  emptyText: { type: String, default: 'No data found' }
})

const emit = defineEmits(['row-click', 'update:selected', 'selection-change'])

// Alias data → rows for internal use
const rows = computed(() => props.data)

const selectedSet = computed(() => new Set((props.selected || []).map(r => r.id)))

const selectableRows = computed(() => {
  if (!props.selectableFilter) return rows.value
  return rows.value.filter(props.selectableFilter)
})

const allSelected = computed(() =>
  selectableRows.value.length > 0 && selectableRows.value.every(r => selectedSet.value.has(r.id))
)

const someSelected = computed(() => {
  const s = selectableRows.value.filter(r => selectedSet.value.has(r.id))
  return s.length > 0 && s.length < selectableRows.value.length
})

const totalCols = computed(() => {
  let n = props.columns.length
  if (props.selectable) n++
  // actions slot check — always count if it might be used
  n++
  return n
})

function isSelected(row) {
  return selectedSet.value.has(row.id)
}

function toggleRow(row) {
  const current = props.selected || []
  let next
  if (current.find(r => r.id === row.id)) {
    next = current.filter(r => r.id !== row.id)
  } else {
    next = [...current, row]
  }
  emit('update:selected', next)
  emit('selection-change', next)
}

function toggleAll() {
  let next
  if (allSelected.value) {
    next = []
  } else {
    next = [...selectableRows.value]
  }
  emit('update:selected', next)
  emit('selection-change', next)
}

function handleRowClick(row) {
  emit('row-click', row)
}

function formatValue(val, col) {
  if (val == null) return '—'
  if (col.type === 'date') return new Date(val).toLocaleDateString()
  if (col.type === 'currency') return `₹${parseFloat(val).toFixed(2)}`
  return val
}

// NOTE: We do NOT reset selection on data change.
// This was causing approval/reject flows to fail because
// re-fetching data would clear the selection mid-operation.

defineExpose({ clearSelection: () => { emit('update:selected', []); emit('selection-change', []) } })
</script>

<style scoped>
.data-table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--color-surface-hover);
}

.row-clickable {
  cursor: pointer;
}

.row-selected {
  background: var(--color-primary-light) !important;
}

.col-checkbox {
  width: 40px;
  text-align: center;
}

.col-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.col-actions {
  width: 120px;
  text-align: right;
}

.cell-center {
  text-align: center;
}
</style>
