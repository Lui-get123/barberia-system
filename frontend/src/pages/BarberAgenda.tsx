import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Appointment } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AppointmentRow } from '@/components/AppointmentRow'

export default function BarberAgenda() {
  const qc = useQueryClient()
  const appts = useQuery({
    queryKey: ['my-agenda'],
    queryFn: async () => (await api.get<Appointment[]>('/api/appointments')).data,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'completed' | 'confirmed' | 'cancelled' }) =>
      api.patch(`/api/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-agenda'] })
      toast.success('Cita actualizada')
    },
  })

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = useMemo(() => (appts.data || []).filter((a) => a.start_at >= today && a.status !== 'cancelled'), [appts.data, today])
  const past = useMemo(() => (appts.data || []).filter((a) => a.start_at < today || a.status === 'cancelled' || a.status === 'completed').slice(0, 20), [appts.data, today])

  const grouped = useMemo(() => {
    const groups = new Map<string, Appointment[]>()
    for (const a of upcoming) {
      const key = a.start_at.slice(0, 10)
      const arr = groups.get(key) || []
      arr.push(a)
      groups.set(key, arr)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [upcoming])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold">Mi agenda</h1>
        <p className="text-muted-foreground text-sm">Tus próximas citas asignadas</p>
      </header>

      {appts.isLoading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Cargando…</CardContent></Card>}

      {grouped.length === 0 && !appts.isLoading && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            No tienes citas próximas asignadas
          </CardContent>
        </Card>
      )}

      {grouped.map(([day, list]) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {format(parseISO(day + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {list.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  showBarber={false}
                  onComplete={() => updateStatus.mutate({ id: a.id, status: 'completed' })}
                  onCancel={() => updateStatus.mutate({ id: a.id, status: 'cancelled' })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {past.map((a) => (
                <AppointmentRow key={a.id} appointment={a} showBarber={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
