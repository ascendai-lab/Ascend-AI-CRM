import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Repeat, Zap, Globe, MapPin, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useServices } from '../hooks/useServices'
import { useClientServices } from '../hooks/useClientServices'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ClientServiceForm from '../components/services/ClientServiceForm'

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-amber-500/20 text-amber-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [companyLoading, setCompanyLoading] = useState(true)
  const { services, loading: servicesLoading } = useServices()
  const { clientServices, loading: csLoading, addClientService, updateClientService, deleteClientService } = useClientServices(id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()
      if (error) {
        console.error('Error:', error)
        navigate('/companies')
      } else {
        setCompany(data)
      }
      setCompanyLoading(false)
    }
    fetchCompany()
  }, [id, navigate])

  const getEffectivePrice = (cs) => {
    return cs.custom_price !== null ? cs.custom_price : cs.services?.default_price || 0
  }

  const activeMRR = clientServices
    .filter(cs => cs.status === 'active' && cs.services?.type === 'recurring')
    .reduce((sum, cs) => sum + Number(getEffectivePrice(cs)), 0)

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateClientService(editing.id, form)
      } else {
        await addClientService(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving client service:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteClientService(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting client service:', err)
    }
    setDeleteTarget(null)
  }

  if (companyLoading || servicesLoading || csLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  if (!company) return null

  return (
    <div>
      <button
        onClick={() => navigate('/companies')}
        className="mb-4 flex items-center gap-2 text-sm text-brand-cream/50 hover:text-brand-cream cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </button>

      <div className="mb-6 rounded-xl border border-white/5 bg-brand-charcoal p-5">
        <h1 className="text-2xl font-bold text-brand-cream">{company.name}</h1>
        {company.industry && (
          <span className="mt-1 inline-block rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
            {company.industry}
          </span>
        )}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-cream/40">
          {company.address && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.address}</span>
          )}
          {company.website_url && (
            <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-lime/70 hover:text-brand-lime">
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
        </div>
        {company.notes && <p className="mt-3 text-sm text-brand-cream/40">{company.notes}</p>}
      </div>

      <div className="mb-4 rounded-xl border border-brand-green/30 bg-brand-green/10 p-4">
        <p className="text-sm text-brand-cream/60">Monthly Recurring Revenue</p>
        <p className="text-2xl font-bold text-brand-lime">${activeMRR.toFixed(2)}<span className="text-sm font-normal text-brand-cream/40">/mo</span></p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-cream">Client Services</h2>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" />
          Assign Service
        </Button>
      </div>

      {clientServices.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-8 text-center">
          <p className="text-brand-cream/50">No services assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clientServices.map(cs => (
            <div key={cs.id} className="group flex items-center justify-between rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cs.services?.type === 'recurring' ? 'bg-brand-green/20 text-brand-lime' : 'bg-amber-500/20 text-amber-400'}`}>
                  {cs.services?.type === 'recurring' ? <Repeat className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-cream">{cs.services?.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-brand-cream/40">
                    <span>${Number(getEffectivePrice(cs)).toFixed(2)}</span>
                    {cs.custom_price !== null && (
                      <span className="text-brand-lime/60">(custom)</span>
                    )}
                    <span>&middot;</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusColors[cs.status]}`}>
                      {cs.status}
                    </span>
                    {cs.start_date && (
                      <>
                        <span>&middot;</span>
                        <span>Started {cs.start_date}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => { setEditing(cs); setModalOpen(true) }}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(cs)}
                  className="rounded-lg p-2 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Client Service' : 'Assign Service'}
      >
        <ClientServiceForm
          clientService={editing}
          services={services}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Service"
        message={`Remove "${deleteTarget?.services?.name}" from this company?`}
      />
    </div>
  )
}
