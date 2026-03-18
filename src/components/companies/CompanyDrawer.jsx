import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Repeat, Zap, Globe, MapPin,
  Loader2, ExternalLink
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useServices } from '../../hooks/useServices'
import { useClientServices } from '../../hooks/useClientServices'
import SlideDrawer from '../ui/SlideDrawer'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import ClientServiceForm from '../services/ClientServiceForm'

const statusColors = {
  active: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-amber-500/20 text-amber-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function CompanyDrawer({ companyId, open, onClose }) {
  const [company, setCompany] = useState(null)
  const [companyLoading, setCompanyLoading] = useState(true)
  const { services, loading: servicesLoading } = useServices()
  const { clientServices, loading: csLoading, addClientService, updateClientService, deleteClientService } = useClientServices(companyId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!companyId) return
    setCompanyLoading(true)
    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()
      if (error) {
        console.error('Error:', error)
      } else {
        setCompany(data)
      }
      setCompanyLoading(false)
    }
    fetchCompany()
  }, [companyId])

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

  const loading = companyLoading || servicesLoading || csLoading

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      title={loading ? 'Loading...' : company?.name || 'Company'}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
        </div>
      ) : !company ? (
        <p className="text-brand-cream/50">Company not found.</p>
      ) : (
        <>
          {/* Company Info Card */}
          <div className="mb-6 rounded-xl border border-white/5 bg-brand-charcoal p-5">
            {company.industry && (
              <span className="mb-2 inline-block rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
                {company.industry}
              </span>
            )}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-cream/40">
              {company.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {company.address}
                </span>
              )}
              {company.website_url && (
                <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-lime/70 hover:text-brand-lime">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
            </div>
            {company.notes && <p className="mt-3 text-sm text-brand-cream/40">{company.notes}</p>}

            <a
              href={`/companies/${companyId}`}
              className="mt-4 inline-flex items-center gap-1 text-xs text-brand-cream/30 hover:text-brand-lime"
            >
              <ExternalLink className="h-3 w-3" /> Open full page
            </a>
          </div>

          {/* MRR */}
          <div className="mb-6 rounded-xl border border-brand-green/30 bg-brand-green/10 p-4">
            <p className="text-sm text-brand-cream/60">Monthly Recurring Revenue</p>
            <p className="text-2xl font-bold text-brand-lime">
              ${activeMRR.toFixed(2)}
              <span className="text-sm font-normal text-brand-cream/40">/mo</span>
            </p>
          </div>

          {/* Client Services */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-cream">Client Services</h3>
            <Button onClick={() => { setEditing(null); setModalOpen(true) }} className="text-xs">
              <Plus className="h-3.5 w-3.5" />
              Assign
            </Button>
          </div>

          {clientServices.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-brand-charcoal p-6 text-center">
              <p className="text-sm text-brand-cream/50">No services assigned yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {clientServices.map(cs => (
                <div key={cs.id} className="group flex items-center justify-between rounded-xl border border-white/5 bg-brand-charcoal p-3 transition-colors hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cs.services?.type === 'recurring' ? 'bg-brand-green/20 text-brand-lime' : 'bg-amber-500/20 text-amber-400'}`}>
                      {cs.services?.type === 'recurring' ? <Repeat className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-cream">{cs.services?.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-brand-cream/40">
                        <span>${Number(getEffectivePrice(cs)).toFixed(2)}</span>
                        {cs.custom_price !== null && (
                          <span className="text-brand-lime/60">(custom)</span>
                        )}
                        <span>&middot;</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusColors[cs.status]}`}>
                          {cs.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => { setEditing(cs); setModalOpen(true) }}
                      className="cursor-pointer rounded-lg p-1.5 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cs)}
                      className="cursor-pointer rounded-lg p-1.5 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modals */}
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
        </>
      )}
    </SlideDrawer>
  )
}
