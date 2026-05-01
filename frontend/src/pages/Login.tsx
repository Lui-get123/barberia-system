import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useAuth } from '@/store/auth'
import { defaultRoute } from '@/components/RequireAuth'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      const role = useAuth.getState().user?.role || 'client'
      toast.success('¡Bienvenido!')
      navigate(defaultRoute(role))
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error de inicio de sesión'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/40">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl gradient-gold flex items-center justify-center shadow-lg mb-4">
            <Scissors className="h-7 w-7 text-gold-900" />
          </div>
          <h1 className="text-3xl font-display font-bold">Bienvenido de nuevo</h1>
          <p className="text-muted-foreground text-sm mt-1">Inicia sesión para gestionar tus citas</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Accede con tu correo y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Iniciando…' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-6 text-sm text-center text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Regístrate
              </Link>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-accent/40 text-xs text-muted-foreground">
              <div className="font-medium mb-1 text-accent-foreground">Cuentas de prueba</div>
              <div>Admin: admin@barberia.com / admin123</div>
              <div>Barbero: juan@barberia.com / barbero123</div>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
