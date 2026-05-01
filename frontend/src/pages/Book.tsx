import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Clock, DollarSign, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { AvailabilitySlot, Service, User } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { cn, formatCurrency, formatDuration, getInitials } from '@/lib/utils'

export default function Book() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [barberId, setBarberId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null)
  const [notes, setNotes] = useState('')

  const services = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get<Service[]>('/api/services')).data,
  })
  const barbers = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => (await api.get<User[]>('/api/users/barbers')).data,
  })
  const availability = useQuery({
    queryKey: ['availability', barberId, serviceId, selectedDate.toISOString().slice(0, 10)],
    enabled: !!barberId && !!serviceId,
    queryFn: async () =>
      (
        await api.get<AvailabilitySlot[]>('/api/appointments/availability', {
          params: { barber_id: barberId, service_id: serviceId, date: selectedDate.toISOString() },
        })
      ).data,
  })

  const createMut = useMutation({
    mutationFn: async () =>
      api.post('/api/appointments', {
        barber_id: barberId,
        service_id: serviceId,
        start_at: slot!.start_at,
        notes: notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      toast.success('¡Cita reservada!')
      navigate('/my-appointments')
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al reservar'
      toast.error(message)
    },
  })

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)), [])

  const selectedService = services.data?.find((s) => s.id === serviceId)
  const selectedBarber = barbers.data?.find((b) => b.id === barberId)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold">Reservar cita</h1>
        <p className="text-muted-foreground text-sm">Elige servicio, barbero y horario</p>
      </header>

      <div className="flex items-center gap-2 text-sm">
        <StepDot n={1} active={step >= 1} label="Servicio" />
        <div className="flex-1 h-px bg-border" />
        <StepDot n={2} active={step >= 2} label="Barbero" />
        <div className="flex-1 h-px bg-border" />
        <StepDot n={3} active={step >= 3} label="Horario" />
        <div className="flex-1 h-px bg-border" />
        <StepDot n={4} active={step >= 4} label="Confirmar" />
      </div>

      {step === 1 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.data?.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServiceId(s.id)
                setStep(2)
              }}
              className={cn(
                'text-left rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5',
                serviceId === s.id && 'ring-2 ring-primary',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center">
                  <Scissors className="h-5 w-5 text-gold-900" />
                </div>
                <span className="font-bold text-primary text-lg">{formatCurrency(s.price)}</span>
              </div>
              <h3 className="font-display font-semibold text-lg">{s.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{s.description}</p>
              <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(s.duration_minutes)}
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => setStep(1)}>
            <ChevronLeft className="h-4 w-4" /> Cambiar servicio
          </Button>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.data?.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBarberId(b.id)
                  setStep(3)
                }}
                className={cn(
                  'text-left rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5',
                  barberId === b.id && 'ring-2 ring-primary',
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(b.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-display font-semibold">{b.full_name}</div>
                    <div className="text-xs text-muted-foreground">{b.specialty || 'Barbero'}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">{b.bio || 'Profesional con experiencia.'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
            <ChevronLeft className="h-4 w-4" /> Cambiar barbero
          </Button>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {days.map((d) => {
              const isSelected = selectedDate.toDateString() === d.toDateString()
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    setSelectedDate(d)
                    setSlot(null)
                  }}
                  className={cn(
                    'min-w-[72px] p-3 rounded-lg border text-center transition-all',
                    isSelected ? 'gradient-gold text-gold-900 border-transparent' : 'bg-card hover:bg-accent',
                  )}
                >
                  <div className="text-xs font-medium uppercase">{format(d, 'EEE', { locale: es })}</div>
                  <div className="text-2xl font-bold font-display">{format(d, 'd')}</div>
                  <div className="text-xs">{format(d, 'MMM', { locale: es })}</div>
                </button>
              )
            })}
          </div>

          <Card>
            <CardContent className="p-5">
              {availability.isLoading && <div className="text-sm text-muted-foreground">Cargando horarios…</div>}
              {availability.data && availability.data.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">No hay horarios disponibles este día</div>
              )}
              {availability.data && availability.data.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availability.data.map((s) => {
                    const isSelected = slot?.start_at === s.start_at
                    return (
                      <button
                        key={s.start_at}
                        onClick={() => setSlot(s)}
                        className={cn(
                          'py-2.5 rounded-lg border text-sm font-medium transition-all',
                          isSelected ? 'gradient-gold text-gold-900 border-transparent shadow-md' : 'bg-card hover:bg-accent',
                        )}
                      >
                        {format(parseISO(s.start_at), 'HH:mm')}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={!slot} onClick={() => setStep(4)}>
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && slot && selectedService && selectedBarber && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
            <ChevronLeft className="h-4 w-4" /> Cambiar horario
          </Button>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted-foreground">Servicio</span>
                <div className="text-right">
                  <div className="font-medium">{selectedService.name}</div>
                  <div className="text-xs text-muted-foreground">{formatDuration(selectedService.duration_minutes)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted-foreground">Barbero</span>
                <div className="font-medium">{selectedBarber.full_name}</div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="text-sm text-muted-foreground">Fecha y hora</span>
                <div className="font-medium capitalize">
                  {format(parseISO(slot.start_at), "EEE d 'de' MMM, HH:mm", { locale: es })}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Total
                </span>
                <div className="text-2xl font-bold text-primary font-display">{formatCurrency(selectedService.price)}</div>
              </div>
              <div className="space-y-1.5 pt-2">
                <Label>Notas (opcional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones para el barbero..." rows={2} />
              </div>
              <Button className="w-full" size="lg" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                <Check className="h-4 w-4" /> {createMut.isPending ? 'Reservando…' : 'Confirmar reserva'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StepDot({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
          active ? 'gradient-gold text-gold-900' : 'bg-muted text-muted-foreground',
        )}
      >
        {n}
      </div>
      <span className={cn('text-xs font-medium hidden sm:inline', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
    </div>
  )
}
