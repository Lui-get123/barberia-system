import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, DollarSign, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Service } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDuration } from '@/lib/utils'

interface ServiceForm {
  name: string
  description: string
  duration_minutes: number
  price: number
}

const empty: ServiceForm = { name: '', description: '', duration_minutes: 30, price: 15 }

export default function Services() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceForm>(empty)

  const services = useQuery({
    queryKey: ['services-admin'],
    queryFn: async () => (await api.get<Service[]>('/api/services?only_active=false')).data,
  })

  const createMut = useMutation({
    mutationFn: async (data: ServiceForm) => (await api.post<Service>('/api/services', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services-admin'] })
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio creado')
      setOpen(false)
      setForm(empty)
    },
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceForm> & { is_active?: boolean } }) =>
      (await api.patch<Service>(`/api/services/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services-admin'] })
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio actualizado')
      setEditing(null)
      setForm(empty)
      setOpen(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services-admin'] })
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio desactivado')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Servicios</h1>
          <p className="text-muted-foreground text-sm">Catálogo de servicios disponibles</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) {
              setEditing(null)
              setForm(empty)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}>
              <Plus className="h-4 w-4" /> Nuevo servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Duración (min)</Label>
                  <Input type="number" min={5} step={5} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Precio (USD)</Label>
                  <Input type="number" min={0} step={0.5} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editing ? 'Guardar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.data?.map((s) => (
          <Card key={s.id} className={!s.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{s.name}</CardTitle>
                {!s.is_active && <Badge variant="secondary">Inactivo</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground min-h-[2.5rem]">{s.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {formatDuration(s.duration_minutes)}
                </span>
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <DollarSign className="h-4 w-4" /> {formatCurrency(s.price)}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditing(s); setForm({ name: s.name, description: s.description || '', duration_minutes: s.duration_minutes, price: s.price }); setOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                {s.is_active ? (
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: s.id, data: { is_active: true } })}>
                    Activar
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
