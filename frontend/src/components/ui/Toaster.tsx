import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/store/theme'

export function Toaster() {
  const theme = useTheme((s) => s.theme)
  return (
    <SonnerToaster
      position="top-right"
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border bg-card text-card-foreground shadow-lg',
        },
      }}
    />
  )
}
