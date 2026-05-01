import { Link } from 'react-router-dom'
import { Calendar, Clock, Scissors, Sparkles, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-gold flex items-center justify-center">
              <Scissors className="h-5 w-5 text-gold-900" />
            </div>
            <span className="font-display font-bold text-lg">Barbería</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Crear cuenta</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-background to-background" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Sistema de gestión moderno
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight">
            Tu barbería, <span className="text-gradient-gold">profesional</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Reserva citas, gestiona barberos y servicios, y lleva el control completo de tu negocio desde un panel
            elegante y rápido.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="px-8">
                Reservar ahora
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Acceso de personal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Reservas online', desc: 'Tus clientes reservan en segundos eligiendo barbero, servicio y horario.' },
            { icon: Users, title: 'Gestión de personal', desc: 'Administra tu equipo de barberos: perfiles, especialidades y agenda.' },
            { icon: Clock, title: 'Control de tiempo', desc: 'Validación automática de horarios y conflictos de citas.' },
            { icon: Star, title: 'UI moderna', desc: 'Interfaz elegante con modo oscuro y diseño responsive.' },
            { icon: Scissors, title: 'Servicios flexibles', desc: 'Crea servicios con precios y duración personalizados.' },
            { icon: Sparkles, title: 'Reportes', desc: 'Métricas clave: citas del día, ingresos del mes, próximas reservas.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-muted-foreground text-center">
          Sistema de gestión de barbería · Hecho con ❤
        </div>
      </footer>
    </div>
  )
}
