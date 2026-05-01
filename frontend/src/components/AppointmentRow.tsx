import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Appointment } from '@/lib/types'
import { formatCurrency, formatDuration } from '@/lib/utils'

interface Props {
  appointment: Appointment
  onComplete?: () => void
  onCancel?: () => void
  showClient?: boolean
  showBarber?: boolean
  actions?: React.ReactNode
}

const statusVariant = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
} as const

const statusLabel = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
} as const

export function AppointmentRow({ appointment, onComplete, onCancel, showClient = true, showBarber = true, actions }: Props) {
  const start = parseISO(appointment.start_at)
  const end = parseISO(appointment.end_at)
  return (
    <div className="py-4 flex flex-wrap items-center gap-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3 flex-1 min-w-[220px]">
        <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{appointment.service.name}</div>
          <div className="text-xs text-muted-foreground">
            {format(start, "EEE d 'de' MMM", { locale: es })} · {format(start, 'HH:mm')}–{format(end, 'HH:mm')} ·{' '}
            {formatDuration(appointment.service.duration_minutes)} · {formatCurrency(appointment.service.price)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {showClient && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="text-foreground">{appointment.client.full_name}</span>
          </div>
        )}
        {showBarber && (
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
            <span>con</span>
            <span className="text-foreground">{appointment.barber.full_name}</span>
          </div>
        )}
        <Badge variant={statusVariant[appointment.status]}>{statusLabel[appointment.status]}</Badge>
      </div>
      {(onComplete || onCancel || actions) && (
        <div className="flex items-center gap-2 ml-auto">
          {actions}
          {onComplete && appointment.status === 'confirmed' && (
            <Button size="sm" variant="outline" onClick={onComplete}>
              Completar
            </Button>
          )}
          {onCancel && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
