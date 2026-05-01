import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { getInitials } from '@/lib/utils'

interface BarberForm {
  email: string
  password: string
  full_name: string
  phone: string
  specialty: string
  bio: string
}

const empty: BarberForm = { email: '', password: '', full_name: '', phone: '', specialty: '', bio: '' }

export default function Barbers() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<BarberForm>(empty)

  const barbers = useQuery({
    queryKey: ['barbers-admin'],
    queryFn: async () => (await api.get<User[]>('/api/users?role=barber')).data,
  })

  const createMut = useMutation({
    mutationFn: async (data: BarberForm) => (await api.post<User>('/api/users', { ...data, role: 'barber' })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbers-admin'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Barbero creado')
      setOpen(false)
      setForm(empty)
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al crear'
      toast.error(message)
    },
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BarberForm> & { is_active?: boolean } }) => {
      const payload: Record<string, unknown> = { ...data }
      if (!payload.password) delete payload.password
      if (!payload.email) delete payload.email
      return (await api.patch<User>(`/api/users/${id}`, payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbers-admin'] })
      toast.success('Barbero actualizado')
      setEditing(null)
      setForm(empty)
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al actualizar'
      toast.error(message)
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbers-admin'] })
      toast.success('Barbero desactivado')
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMut.mutate({ id: editing.id, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  const startEdit = (b: User) => {
    setEditing(b)
    setForm({
      email: b.email,
      password: '',
      full_name: b.full_name,
      phone: b.phone || '',
      specialty: b.specialty || '',
      bio: b.bio || '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Barberos</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu equipo</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty) } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}>
              <Plus className="h-4 w-4" /> Nuevo barbero
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar barbero' : 'Nuevo barbero'}</DialogTitle>
              <DialogDescription>Datos del miembro del equipo</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre completo</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Especialidad</Label>
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Cortes clásicos, fades..." />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Biografía</Label>
                  <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={editing ? undefined : 6} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Guardar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.isLoading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Cargando…</CardContent></Card>}
        {barbers.data?.map((b) => (
          <Card key={b.id} className={!b.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(b.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{b.full_name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{b.specialty || 'Barbero'}</div>
                  </div>
                </div>
                <Badge variant={b.is_active ? 'success' : 'danger'}>
                  {b.is_active ? <><UserCheck className="h-3 w-3 mr-1" /> Activo</> : <><UserX className="h-3 w-3 mr-1" /> Inactivo</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{b.bio || 'Sin biografía'}</div>
              <div className="text-xs text-muted-foreground">
                <div>{b.email}</div>
                {b.phone && <div>{b.phone}</div>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { startEdit(b); setOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                {b.is_active ? (
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(b.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: b.id, data: { is_active: true } })}>
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
