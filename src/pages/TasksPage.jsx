import { useState } from 'react'
import { CheckSquare, Plus, Pencil, Trash2, Calendar, User, Briefcase, Loader2, Square, CheckSquare2 } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useContacts } from '../hooks/useContacts'
import { useDeals } from '../hooks/useDeals'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TaskForm from '../components/tasks/TaskForm'

const filters = ['all', 'due today', 'upcoming', 'completed']

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTask } = useTasks()
  const { contacts, loading: cLoading } = useContacts()
  const { deals, loading: dLoading } = useDeals()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const today = new Date().toISOString().split('T')[0]

  const filtered = tasks.filter(t => {
    switch (filter) {
      case 'due today': return t.due_date === today && !t.completed
      case 'upcoming': return t.due_date && t.due_date > today && !t.completed
      case 'completed': return t.completed
      default: return true
    }
  })

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateTask(editing.id, form)
      } else {
        await addTask(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving task:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTask(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting task:', err)
    }
    setDeleteTarget(null)
  }

  const isOverdue = (task) => task.due_date && task.due_date < today && !task.completed

  if (loading || cLoading || dLoading) {
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
          <h1 className="text-2xl font-bold text-brand-cream">Tasks</h1>
          <p className="mt-1 text-sm text-brand-cream/50">
            {tasks.filter(t => !t.completed).length} open &middot; {tasks.filter(t => t.completed).length} completed
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-brand-green text-brand-cream'
                : 'bg-white/5 text-brand-cream/50 hover:bg-white/10 hover:text-brand-cream'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-12 text-center">
          <CheckSquare className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">
            {filter === 'all' ? 'No tasks yet. Add your first one!' : `No ${filter} tasks.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(task => (
            <div
              key={task.id}
              className="group flex items-start gap-3 rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10"
            >
              <button
                onClick={() => toggleTask(task.id, !task.completed)}
                className="mt-0.5 shrink-0 cursor-pointer text-brand-cream/40 hover:text-brand-lime"
              >
                {task.completed
                  ? <CheckSquare2 className="h-5 w-5 text-brand-lime" />
                  : <Square className="h-5 w-5" />
                }
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${task.completed ? 'text-brand-cream/30 line-through' : 'text-brand-cream'}`}>
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-brand-cream/40">
                  {task.due_date && (
                    <span className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-400' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      {task.due_date}
                      {isOverdue(task) && ' (overdue)'}
                    </span>
                  )}
                  {task.contacts && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {task.contacts.first_name} {task.contacts.last_name}
                    </span>
                  )}
                  {task.deals && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {task.deals.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => { setEditing(task); setModalOpen(true) }}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(task)}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Task' : 'Add Task'}
      >
        <TaskForm
          task={editing}
          contacts={contacts}
          deals={deals}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}
