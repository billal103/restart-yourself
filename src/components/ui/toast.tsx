import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/stores/toastStore'

const icons = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant ?? 'default']
        return (
          <ToastPrimitive.Root
            key={toast.id}
            duration={5000}
            onOpenChange={(open) => {
              if (!open) dismiss(toast.id)
            }}
            className={cn(
              'flex items-start gap-3 rounded-lg border border-surface-muted bg-background p-4 shadow-elevated data-[state=open]:animate-in data-[state=closed]:animate-out',
              toast.variant === 'error' && 'border-error-500/30',
              toast.variant === 'success' && 'border-success-500/30',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 size-5 shrink-0',
                toast.variant === 'error' && 'text-error-500',
                toast.variant === 'success' && 'text-success-500',
                (!toast.variant || toast.variant === 'default') && 'text-primary-500',
              )}
            />
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-text-primary">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="mt-1 text-sm text-text-secondary">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="text-text-muted hover:text-text-primary focus-ring rounded">
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  )
}
