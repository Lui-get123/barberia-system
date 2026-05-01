import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Appointment } from '@/lib/types'
import { AppointmentRow } from '@/components/AppointmentRow'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function MyAppointments() {
  const qc = useQueryClient()
  const appts = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => (await api.get<Appointment[]>('/api/appointments')).data,
  })

  const cancelMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      toast.success('Cita cancelada')
    },
  })

  const today = new Date().toISOString()
  const upcoming = useMemo(() => (appts.data || []).filter((a) => a.start_at >= today && a.status !== 'cancelled'), [appts.data, today])
  const history = useMemo(
    () => (appts.data || []).filter((a) => a.start_at < today || a.status === 'cancelled' || a.status === 'completed').slice(0, 20),
    [appts.data, today],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Mis citas</h1>
          <p className="text-muted-foreground text-sm">Tus reservas y tu historial</p>
        </div>
        <Link to="/book">
          <Button>
            <Plus className="h-4 w-4" /> Nueva cita
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No tienes citas próximas.{' '}
              <Link to="/book" className="text-primary hover:underline">
                Reserva una ahora
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {upcoming.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  showClient={false}
                  onCancel={() => cancelMut.mutate(a.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {history.map((a) => (
                <AppointmentRow key={a.id} appointment={a} showClient={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
