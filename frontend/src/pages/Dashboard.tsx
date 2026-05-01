import { useQuery } from '@tanstack/react-query'
import { CalendarDays, DollarSign, ScanEye, Scissors, ShoppingBag, Users } from 'lucide-react'
import { api } from '@/lib/api'
import type { Appointment, DashboardStats } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { AppointmentRow } from '@/components/AppointmentRow'

export default function Dashboard() {
  const stats = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get<DashboardStats>('/api/dashboard/stats')).data,
  })

  const upcoming = useQuery({
    queryKey: ['appointments-upcoming'],
    queryFn: async () => (await api.get<Appointment[]>('/api/appointments?status=confirmed')).data.slice(0, 6),
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold">Panel de administración</h1>
        <p className="text-muted-foreground text-sm">Resumen de tu negocio en tiempo real</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Citas hoy" value={stats.data?.appointments_today ?? '—'} icon={<CalendarDays className="h-4 w-4" />} accent />
        <StatCard label="Próximas" value={stats.data?.upcoming_appointments ?? '—'} icon={<ScanEye className="h-4 w-4" />} />
        <StatCard label="Ingresos del mes" value={stats.data ? formatCurrency(stats.data.revenue_this_month) : '—'} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Esta semana" value={stats.data?.appointments_this_week ?? '—'} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Clientes" value={stats.data?.total_clients ?? '—'} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Barberos" value={stats.data?.total_barbers ?? '—'} icon={<Scissors className="h-4 w-4" />} />
        <StatCard label="Servicios" value={stats.data?.total_services ?? '—'} icon={<ShoppingBag className="h-4 w-4" />} />
        <StatCard label="Total citas" value={stats.data?.total_appointments ?? '—'} icon={<CalendarDays className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas citas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : upcoming.data && upcoming.data.length > 0 ? (
            <div className="divide-y">
              {upcoming.data.map((a) => (
                <AppointmentRow key={a.id} appointment={a} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">No hay citas próximas</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={accent ? 'gradient-gold text-gold-900 border-0' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${accent ? 'text-gold-900/80' : 'text-muted-foreground'}`}>{label}</span>
          <span className={accent ? 'text-gold-900' : 'text-muted-foreground'}>{icon}</span>
        </div>
        <div className="text-2xl font-bold font-display">{value}</div>
      </CardContent>
    </Card>
  )
}
