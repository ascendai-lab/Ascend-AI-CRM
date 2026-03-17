import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Building2, User, Pencil, Trash2, GripVertical } from 'lucide-react'

export default function DealCard({ deal, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-white/5 bg-brand-black p-3 transition-colors hover:border-white/10"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-brand-cream/20 hover:text-brand-cream/50 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-brand-cream truncate">{deal.name}</h4>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-brand-cream/40">
            {deal.companies?.name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {deal.companies.name}
              </span>
            )}
            {deal.contacts && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {deal.contacts.first_name} {deal.contacts.last_name}
              </span>
            )}
          </div>
          {deal.value > 0 && (
            <p className="mt-1.5 text-sm font-semibold text-brand-lime">
              ${Number(deal.value).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onEdit(deal)} className="rounded p-1 text-brand-cream/30 hover:bg-white/10 hover:text-brand-cream cursor-pointer">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(deal)} className="rounded p-1 text-brand-cream/30 hover:bg-red-500/20 hover:text-red-400 cursor-pointer">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
