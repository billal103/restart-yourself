import { create } from 'zustand'

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

interface ToastItem extends ToastOptions {
  id: string
}

interface ToastState {
  toasts: ToastItem[]
  show: (toast: ToastOptions) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(options: ToastOptions) {
  useToastStore.getState().show(options)
}
