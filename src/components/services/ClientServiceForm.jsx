import { useState, useEffect } from 'react'
import Select from '../ui/Select'
import Input from '../ui/Input'
import Button from '../ui/Button'

const emptyForm = { service_id: '', custom_price: '', status: 'active', start_date: '' }

export default function ClientServiceForm({ clientService, services, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)
  const selectedService = services.find(s => s.id === form.service_id)

  useEffect(() => {
    if (clientService) {
      setForm({
        service_id: clientService.service_id || '',
        custom_price: clientService.custom_price?.toString() || '',
        status: clientService.status || 'active',
        start_date: clientService.start_date || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [clientService])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      service_id: form.service_id,
      custom_price: form.custom_price ? parseFloat(form.custom_price) : null,
      status: form.status,
      start_date: form.start_date || null,
    })
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select label="Service *" id="cs_service" value={form.service_id} onChange={update('service_id')} required>
        <option value="">Select a service...</option>
        {services.map(s => (
          <option key={s.id} value={s.id}>{s.name} — ${Number(s.default_price).toFixed(2)} ({s.type})</option>
        ))}
      </Select>
      <Input
        label={`Custom Price ($)${selectedService ? ` — Default: $${Number(selectedService.default_price).toFixed(2)}` : ''}`}
        id="cs_price"
        type="number"
        min="0"
        step="0.01"
        value={form.custom_price}
        onChange={update('custom_price')}
        placeholder="Leave blank to use default price"
      />
      <Select label="Status" id="cs_status" value={form.status} onChange={update('status')}>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="cancelled">Cancelled</option>
      </Select>
      <Input label="Start Date" id="cs_start" type="date" value={form.start_date} onChange={update('start_date')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.service_id}>
          {loading ? 'Saving...' : clientService ? 'Update' : 'Assign Service'}
        </Button>
      </div>
    </form>
  )
}
