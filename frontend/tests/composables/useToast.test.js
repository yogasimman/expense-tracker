import { describe, it, expect, vi } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  it('adds and returns toasts', () => {
    const toast = useToast()
    toast.success('Saved!')
    
    const toasts = toast.toasts
    expect(toasts.length).toBeGreaterThanOrEqual(1)
    const last = toasts[toasts.length - 1]
    expect(last.message).toBe('Saved!')
    expect(last.type).toBe('success')
  })

  it('adds error toast', () => {
    const toast = useToast()
    toast.error('Failed!')
    
    const last = toast.toasts[toast.toasts.length - 1]
    expect(last.type).toBe('error')
    expect(last.message).toBe('Failed!')
  })

  it('adds info toast', () => {
    const toast = useToast()
    toast.info('Note')
    
    const last = toast.toasts[toast.toasts.length - 1]
    expect(last.type).toBe('info')
  })

  it('removes toast', () => {
    const toast = useToast()
    toast.success('Test')
    const id = toast.toasts[toast.toasts.length - 1].id
    const lenBefore = toast.toasts.length
    toast.remove(id)
    expect(toast.toasts.length).toBe(lenBefore - 1)
  })
})
