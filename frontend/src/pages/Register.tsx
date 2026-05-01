import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useAuth } from '@/store/auth'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuth((s) => s.register)
  const loading = useAuth((s) => s.loading)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await register(form)
      toast.success('¡Cuenta creada!')
      navigate('/book')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al registrarse'
      toast.error(message)
    }
  }

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/40">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-gold flex items-center justify-center shadow-lg mb-4">
            <Scissors className="h-7 w-7 text-gold-900" />
          </div>
          <h1 className="text-3xl font-display font-bold">Crear cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">Reserva tu próxima cita en segundos</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>Completa tus datos para empezar</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" value={form.full_name} onChange={upd('full_name')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={upd('email')} required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={upd('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={form.password} onChange={upd('password')} required minLength={6} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creando…' : 'Crear cuenta'}
              </Button>
            </form>
            <div className="mt-6 text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
