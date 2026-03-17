import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import TextArea from '../ui/TextArea'
import Button from '../ui/Button'

const emptyForm = {
  name: '',
  address: '',
  website_url: '',
  google_business_url: '',
  industry: '',
  notes: '',
}

export default function CompanyForm({ company, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        address: company.address || '',
        website_url: company.website_url || '',
        google_business_url: company.google_business_url || '',
        industry: company.industry || '',
        notes: company.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [company])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Company Name *" id="name" value={form.name} onChange={update('name')} required placeholder="Acme Corp" />
      <Input label="Address" id="address" value={form.address} onChange={update('address')} placeholder="123 Main St, City, State" />
      <Input label="Website URL" id="website_url" value={form.website_url} onChange={update('website_url')} placeholder="https://example.com" />
      <Input label="Google Business Profile URL" id="google_business_url" value={form.google_business_url} onChange={update('google_business_url')} placeholder="https://g.page/..." />
      <Input label="Industry" id="industry" value={form.industry} onChange={update('industry')} placeholder="e.g. Restaurant, Real Estate" />
      <TextArea label="Notes" id="notes" value={form.notes} onChange={update('notes')} placeholder="Any additional notes..." />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.name.trim()}>
          {loading ? 'Saving...' : company ? 'Update Company' : 'Add Company'}
        </Button>
      </div>
    </form>
  )
}
