import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

const emptyForm = { name: '', type: 'recurring', default_price: '' }

export default function ServiceForm({ service, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        type: service.type || 'recurring',
        default_price: service.default_price?.toString() || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [service])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, default_price: parseFloat(form.default_price) || 0 })
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Service Name *" id="svc_name" value={form.name} onChange={update('name')} required placeholder="e.g. Social Media Management" />
      <Select label="Type *" id="svc_type" value={form.type} onChange={update('type')}>
        <option value="recurring">Recurring (Monthly)</option>
        <option value="one-time">One-Time</option>
      </Select>
      <Input label="Default Price ($) *" id="svc_price" type="number" min="0" step="0.01" value={form.default_price} onChange={update('default_price')} required placeholder="500.00" />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.name.trim()}>
          {loading ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
        </Button>
      </div>
    </form>
  )
}
