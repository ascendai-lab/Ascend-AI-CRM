import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { Plus, Loader2 } from 'lucide-react'
import { useDeals } from '../hooks/useDeals'
import { useCompanies } from '../hooks/useCompanies'
import { useContacts } from '../hooks/useContacts'
import KanbanColumn from '../components/pipeline/KanbanColumn'
import DealCard from '../components/pipeline/DealCard'
import DealForm from '../components/pipeline/DealForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const stages = ['Lead', 'Contacted', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']

export default function PipelinePage() {
  const { deals, loading, addDeal, updateDeal, deleteDeal, moveDeal } = useDeals()
  const { companies, loading: cLoading } = useCompanies()
  const { contacts, loading: ctLoading } = useContacts()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const dealsByStage = {}
  stages.forEach(s => { dealsByStage[s] = [] })
  deals.forEach(d => {
    if (dealsByStage[d.stage]) dealsByStage[d.stage].push(d)
  })

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const dealId = active.id
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    // Determine target stage: over could be a column (stage name) or another deal card
    let targetStage = null
    if (stages.includes(over.id)) {
      targetStage = over.id
    } else {
      const overDeal = deals.find(d => d.id === over.id)
      if (overDeal) targetStage = overDeal.stage
    }

    if (targetStage && targetStage !== deal.stage) {
      moveDeal(dealId, targetStage)
    }
  }

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateDeal(editing.id, form)
      } else {
        await addDeal(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving deal:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDeal(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting deal:', err)
    }
    setDeleteTarget(null)
  }

  const openEdit = (deal) => {
    setEditing(deal)
    setModalOpen(true)
  }

  if (loading || cLoading || ctLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  const openDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage))
  const totalPipeline = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">Pipeline</h1>
          <p className="mt-1 text-sm text-brand-cream/50">
            {openDeals.length} open deal{openDeals.length !== 1 ? 's' : ''} &middot; ${totalPipeline.toLocaleString()} total value
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" />
          Add Deal
        </Button>
      </div>

      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3">
            {stages.map(stage => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage]}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal ? (
              <div className="w-64 opacity-90">
                <DealCard deal={activeDeal} onEdit={() => {}} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Deal' : 'Add Deal'}
      >
        <DealForm
          deal={editing}
          companies={companies}
          contacts={contacts}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
