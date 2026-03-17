import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import TextArea from '../ui/TextArea'
import Select from '../ui/Select'
import Button from '../ui/Button'

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  job_title: '',
  company_id: '',
  notes: '',
}

export default function ContactForm({ contact, companies, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        job_title: contact.job_title || '',
        company_id: contact.company_id || '',
        notes: contact.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [contact])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, company_id: form.company_id || null }
    onSubmit(payload)
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name *" id="first_name" value={form.first_name} onChange={update('first_name')} required placeholder="John" />
        <Input label="Last Name *" id="last_name" value={form.last_name} onChange={update('last_name')} required placeholder="Doe" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" id="phone" value={form.phone} onChange={update('phone')} placeholder="(555) 123-4567" />
        <Input label="Email" id="email" type="email" value={form.email} onChange={update('email')} placeholder="john@example.com" />
      </div>
      <Input label="Job Title" id="job_title" value={form.job_title} onChange={update('job_title')} placeholder="Marketing Director" />
      <Select label="Company" id="company_id" value={form.company_id} onChange={update('company_id')}>
        <option value="">No company linked</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>
      <TextArea label="Notes" id="notes" value={form.notes} onChange={update('notes')} placeholder="Any additional notes..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.first_name.trim() || !form.last_name.trim()}>
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
        </Button>
      </div>
    </form>
  )
}
