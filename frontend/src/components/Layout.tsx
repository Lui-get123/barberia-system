import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Menu, Moon, Scissors, ShoppingBag, Sun, Users, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { cn, getInitials } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles: string[]
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['admin'] },
  { to: '/agenda', label: 'Mi agenda', icon: <Calendar className="h-4 w-4" />, roles: ['barber'] },
  { to: '/appointments', label: 'Citas', icon: <Calendar className="h-4 w-4" />, roles: ['admin'] },
  { to: '/barbers', label: 'Barberos', icon: <Users className="h-4 w-4" />, roles: ['admin'] },
  { to: '/services', label: 'Servicios', icon: <ShoppingBag className="h-4 w-4" />, roles: ['admin'] },
  { to: '/book', label: 'Reservar', icon: <Scissors className="h-4 w-4" />, roles: ['client'] },
  { to: '/my-appointments', label: 'Mis citas', icon: <Calendar className="h-4 w-4" />, roles: ['client'] },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [])

  if (!user) return null

  const items = NAV.filter((n) => n.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-6 h-16 border-b">
          <div className="h-9 w-9 rounded-lg gradient-gold flex items-center justify-center">
            <Scissors className="h-5 w-5 text-gold-900" />
          </div>
          <div>
            <div className="font-display text-lg font-bold">Barbería</div>
            <div className="text-xs text-muted-foreground -mt-1">Sistema de gestión</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.full_name}</div>
              <div className="text-xs text-muted-foreground capitalize">{roleLabel(user.role)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggle} title="Cambiar tema">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-gold flex items-center justify-center">
            <Scissors className="h-4 w-4 text-gold-900" />
          </div>
          <div className="font-display font-bold">Barbería</div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 pt-14 bg-background animate-fade-in">
          <nav className="p-4 space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 border-t mt-4">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </Button>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 lg:pl-0 pt-14 lg:pt-0 min-w-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Administrador'
  if (role === 'barber') return 'Barbero'
  return 'Cliente'
}
