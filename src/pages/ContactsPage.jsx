import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Pencil, Trash2, Mail, Phone, Loader2, Building2, ChevronRight } from 'lucide-react'
import { useContacts } from '../hooks/useContacts'
import { useCompanies } from '../hooks/useCompanies'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ContactForm from '../components/contacts/ContactForm'

export default function ContactsPage() {
  const { contacts, loading, addContact, updateContact, deleteContact } = useContacts()
  const { companies, loading: companiesLoading } = useCompanies()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = contacts.filter(c => {
    const full = `${c.first_name} ${c.last_name} ${c.email || ''} ${c.companies?.name || ''}`.toLowerCase()
    return full.includes(search.toLowerCase())
  })

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        await updateContact(editing.id, form)
      } else {
        await addContact(form)
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Error saving contact:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteContact(deleteTarget.id)
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
    setDeleteTarget(null)
  }

  const openEdit = (e, contact) => {
    e.stopPropagation()
    setEditing(contact)
    setModalOpen(true)
  }

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  if (loading || companiesLoading) {
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
          <h1 className="text-2xl font-bold text-brand-cream">Contacts</h1>
          <p className="mt-1 text-sm text-brand-cream/50">{contacts.length} total</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <input
        type="text"
        placeholder="Search contacts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-brand-charcoal px-4 py-2.5 text-sm text-brand-cream placeholder-brand-cream/30 outline-none focus:border-brand-green"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">
            {search ? 'No contacts match your search.' : 'No contacts yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(contact => (
            <div
              key={contact.id}
              onClick={() => navigate(`/contacts/${contact.id}`)}
              className="group cursor-pointer rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-brand-cream">
                      {contact.first_name} {contact.last_name}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-brand-cream/20" />
                    {contact.job_title && (
                      <span className="text-xs text-brand-cream/40">
                        — {contact.job_title}
                      </span>
                    )}
                  </div>
                  {contact.companies?.name && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
                      <Building2 className="h-3 w-3" />
                      {contact.companies.name}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-cream/40">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-brand-lime">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-brand-lime">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="mt-2 text-xs text-brand-cream/40 line-clamp-2">{contact.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => openEdit(e, contact)}
                    className="rounded-lg p-2 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact) }}
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
        title={editing ? 'Edit Contact' : 'Add Contact'}
      >
        <ContactForm
          contact={editing}
          companies={companies}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deleteTarget?.first_name} ${deleteTarget?.last_name}"? This action cannot be undone.`}
      />
    </div>
  )
}
