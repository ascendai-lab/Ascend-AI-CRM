import { useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import TextArea from '../ui/TextArea'
import Button from '../ui/Button'

export default function TouchpointForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'call',
    notes: '',
    follow_up_date: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, follow_up_date: form.follow_up_date || null })
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date *" id="tp_date" type="date" value={form.date} onChange={update('date')} required />
        <Select label="Type *" id="tp_type" value={form.type} onChange={update('type')}>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="text">Text</option>
        </Select>
      </div>
      <TextArea label="Notes" id="tp_notes" value={form.notes} onChange={update('notes')} placeholder="What was discussed..." />
      <Input label="Next Follow-up Date" id="tp_followup" type="date" value={form.follow_up_date} onChange={update('follow_up_date')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Add Touchpoint'}
        </Button>
      </div>
    </form>
  )
}
