import { reactive, readonly } from 'vue'

const state = reactive({ toasts: [] })
let id = 0

function show(message, type = 'info', duration = 4000) {
  const toast = { id: ++id, message, type }
  state.toasts.push(toast)
  if (duration > 0) {
    setTimeout(() => remove(toast.id), duration)
  }
}

function remove(toastId) {
  const idx = state.toasts.findIndex(t => t.id === toastId)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

export function useToast() {
  return {
    toasts: readonly(state).toasts,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
    remove
  }
}
