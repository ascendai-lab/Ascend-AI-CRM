import { useState } from 'react'
import { Building2, Plus, Pencil, Trash2, Globe, MapPin, Loader2, ChevronRight } from 'lucide-react'
import { useCompanies } from '../hooks/useCompanies'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CompanyForm from '../components/companies/CompanyForm'
import CompanyDrawer from '../components/companies/CompanyDrawer'

export default function CompaniesPage() {
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerId, setDrawerId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateCompany(editing.id, form)
      } else {
        await addCompany(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving company:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCompany(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting company:', err)
    }
    setDeleteTarget(null)
  }

  const openEdit = (e, company) => {
    e.stopPropagation()
    setEditing(company)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-brand-cream">Companies</h1>
          <p className="mt-1 text-sm text-brand-cream/50">{companies.length} total</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-brand-charcoal px-4 py-2.5 text-sm text-brand-cream placeholder-brand-cream/30 outline-none focus:border-brand-green"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">
            {search ? 'No companies match your search.' : 'No companies yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(company => (
            <div
              key={company.id}
              onClick={() => setDrawerId(company.id)}
              className="group cursor-pointer rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-brand-cream">{company.name}</h3>
                    <ChevronRight className="h-4 w-4 text-brand-cream/20" />
                  </div>
                  {company.industry && (
                    <span className="mt-1 inline-block rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
                      {company.industry}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-cream/40">
                    {company.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {company.address}
                      </span>
                    )}
                    {company.website_url && (
                      <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-brand-lime/70 hover:text-brand-lime"
                      >
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                  {company.notes && (
                    <p className="mt-2 text-xs text-brand-cream/40 line-clamp-2">{company.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => openEdit(e, company)}
                    className="rounded-lg p-2 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(company) }}
                    className="rounded-lg p-2 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Company' : 'Add Company'}
      >
        <CompanyForm
          company={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />

      <CompanyDrawer
        companyId={drawerId}
        open={!!drawerId}
        onClose={() => setDrawerId(null)}
      />
    </div>
  )
}
