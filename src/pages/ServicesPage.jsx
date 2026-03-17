import { useState } from 'react'
import { Settings, Plus, Pencil, Trash2, RefreshCw, Repeat, Zap, Loader2 } from 'lucide-react'
import { useServices } from '../hooks/useServices'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ServiceForm from '../components/services/ServiceForm'

export default function ServicesPage() {
  const { services, loading, addService, updateService, deleteService, seedDefaults } = useServices()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateService(editing.id, form)
      } else {
        await addService(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving service:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteService(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting service:', err)
    }
    setDeleteTarget(null)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedDefaults()
    } catch (err) {
      console.error('Error seeding defaults:', err)
    }
    setSeeding(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">Service Catalog</h1>
          <p className="mt-1 text-sm text-brand-cream/50">Manage the services you offer to clients</p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <Button variant="secondary" onClick={handleSeed} disabled={seeding}>
              <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Loading...' : 'Load Defaults'}
            </Button>
          )}
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-12 text-center">
          <Settings className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">No services yet. Add your own or load the defaults.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map(service => (
            <div
              key={service.id}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${service.type === 'recurring' ? 'bg-brand-green/20 text-brand-lime' : 'bg-amber-500/20 text-amber-400'}`}>
                  {service.type === 'recurring' ? <Repeat className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-cream">{service.name}</h3>
                  <p className="text-xs text-brand-cream/40">
                    {service.type === 'recurring' ? 'Monthly recurring' : 'One-time'} &middot; ${Number(service.default_price).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => { setEditing(service); setModalOpen(true) }}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(service)}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Service' : 'Add Service'}
      >
        <ServiceForm
          service={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove it from any client assignments.`}
      />
    </div>
  )
}
