import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DealCard from './DealCard'

const stageColors = {
  'Lead': 'border-t-blue-500',
  'Contacted': 'border-t-cyan-500',
  'Proposal Sent': 'border-t-amber-500',
  'Negotiating': 'border-t-purple-500',
  'Closed Won': 'border-t-emerald-500',
  'Closed Lost': 'border-t-red-500',
}

export default function KanbanColumn({ stage, deals, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const totalValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] w-64 shrink-0 flex-col rounded-xl border-t-2 bg-brand-charcoal ${stageColors[stage] || 'border-t-gray-500'} ${isOver ? 'ring-1 ring-brand-lime/30' : ''}`}
    >
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-cream/70">{stage}</h3>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-brand-cream/50">{deals.length}</span>
        </div>
        {totalValue > 0 && (
          <p className="mt-0.5 text-xs text-brand-cream/30">${totalValue.toLocaleString()}</p>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 pt-0">
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
