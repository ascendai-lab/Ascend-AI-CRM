import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

const emptyForm = { title: '', due_date: '', contact_id: '', deal_id: '' }

export default function TaskForm({ task, contacts, deals, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        due_date: task.due_date || '',
        contact_id: task.contact_id || '',
        deal_id: task.deal_id || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [task])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      title: form.title,
      due_date: form.due_date || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
    })
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Title *" id="task_title" value={form.title} onChange={update('title')} required placeholder="e.g. Follow up with client" />
      <Input label="Due Date" id="task_due" type="date" value={form.due_date} onChange={update('due_date')} />
      <Select label="Linked Contact" id="task_contact" value={form.contact_id} onChange={update('contact_id')}>
        <option value="">None</option>
        {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
      </Select>
      <Select label="Linked Deal" id="task_deal" value={form.deal_id} onChange={update('deal_id')}>
        <option value="">None</option>
        {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </Select>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.title.trim()}>
          {loading ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
        </Button>
      </div>
    </form>
  )
}
