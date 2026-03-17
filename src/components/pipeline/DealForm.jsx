import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

const stages = ['Lead', 'Contacted', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']

const emptyForm = { name: '', company_id: '', contact_id: '', stage: 'Lead', value: '' }

export default function DealForm({ deal, companies, contacts, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name || '',
        company_id: deal.company_id || '',
        contact_id: deal.contact_id || '',
        stage: deal.stage || 'Lead',
        value: deal.value?.toString() || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [deal])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name: form.name,
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      stage: form.stage,
      value: parseFloat(form.value) || 0,
    })
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Deal Name *" id="deal_name" value={form.name} onChange={update('name')} required placeholder="e.g. Website redesign for Acme" />
      <Select label="Company" id="deal_company" value={form.company_id} onChange={update('company_id')}>
        <option value="">No company</option>
        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="Contact" id="deal_contact" value={form.contact_id} onChange={update('contact_id')}>
        <option value="">No contact</option>
        {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
      </Select>
      <Select label="Stage" id="deal_stage" value={form.stage} onChange={update('stage')}>
        {stages.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Input label="Estimated Value ($)" id="deal_value" type="number" min="0" step="0.01" value={form.value} onChange={update('value')} placeholder="5000" />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.name.trim()}>
          {loading ? 'Saving...' : deal ? 'Update Deal' : 'Add Deal'}
        </Button>
      </div>
    </form>
  )
}
