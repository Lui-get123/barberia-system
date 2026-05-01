import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Appointment, AppointmentStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { AppointmentRow } from '@/components/AppointmentRow'

const STATUSES: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

export default function AppointmentsAdmin() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all')

  const appts = useQuery({
    queryKey: ['appointments-all', filter],
    queryFn: async () => {
      const params = filter === 'all' ? '' : `?status=${filter}`
      return (await api.get<Appointment[]>(`/api/appointments${params}`)).data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: AppointmentStatus }) =>
      api.patch(`/api/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments-all'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const cancelMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments-all'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Cita cancelada')
    },
  })

  const grouped = useMemo(() => {
    const data = appts.data || []
    const groups = new Map<string, Appointment[]>()
    for (const a of data) {
      const key = a.start_at.slice(0, 10)
      const arr = groups.get(key) || []
      arr.push(a)
      groups.set(key, arr)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [appts.data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Todas las citas</h1>
          <p className="text-muted-foreground text-sm">Vista global de la barbería</p>
        </div>
        <div className="w-48">
          <Select value={filter} onValueChange={(v) => setFilter(v as AppointmentStatus | 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {appts.isLoading && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando…</CardContent>
        </Card>
      )}

      {grouped.length === 0 && !appts.isLoading && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">No hay citas que coincidan</CardContent>
        </Card>
      )}

      {grouped.map(([day, list]) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {new Date(day + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {list.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  onComplete={() => updateStatus.mutate({ id: a.id, status: 'completed' })}
                  onCancel={() => cancelMut.mutate(a.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
