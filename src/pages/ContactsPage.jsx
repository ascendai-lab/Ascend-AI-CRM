import { useState, useEffect, useMemo } from 'react'
import {
  Users, Plus, Pencil, Trash2, Mail, Phone, Loader2,
  ArrowUp, ArrowDown, ArrowUpDown, Copy, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useContacts } from '../hooks/useContacts'
import { useCompanies } from '../hooks/useCompanies'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ContactForm from '../components/contacts/ContactForm'
import ContactDrawer from '../components/contacts/ContactDrawer'

// Derive status from last touchpoint date
function deriveStatus(lastActivityDate) {
  if (!lastActivityDate) return 'New'
  const days = Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / 86400000)
  if (days <= 30) return 'Active'
  return 'Inactive'
}

const statusColors = {
  Active: 'bg-emerald-500/15 text-emerald-400',
  Inactive: 'bg-amber-500/15 text-amber-400',
  New: 'bg-blue-500/15 text-blue-400',
}

export default function ContactsPage() {
  const { contacts, loading, addContact, updateContact, deleteContact } = useContacts()
  const { companies, loading: companiesLoading } = useCompanies()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerId, setDrawerId] = useState(null) // contact id for slide-out drawer
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [copiedId, setCopiedId] = useState(null) // tracks "field:id" for copy feedback

  // Fetch latest touchpoint per contact for Last Activity + Status
  const [touchpointMap, setTouchpointMap] = useState({}) // { contact_id: date }
  const [tpLoading, setTpLoading] = useState(true)

  useEffect(() => {
    async function fetchLatestTouchpoints() {
      setTpLoading(true)
      const { data, error } = await supabase
        .from('touchpoints')
        .select('contact_id, date')
        .order('date', { ascending: false })
      if (!error && data) {
        const map = {}
        data.forEach(tp => {
          if (!map[tp.contact_id]) map[tp.contact_id] = tp.date
        })
        setTouchpointMap(map)
      }
      setTpLoading(false)
    }
    fetchLatestTouchpoints()
  }, [contacts]) // re-fetch when contacts change (e.g. after add)

  // Enrich contacts with derived data
  const enriched = useMemo(() => {
    return contacts.map(c => {
      const lastActivity = touchpointMap[c.id] || null
      return {
        ...c,
        lastActivity,
        status: deriveStatus(lastActivity),
        fullName: `${c.first_name} ${c.last_name}`,
        companyName: c.companies?.name || '',
      }
    })
  }, [contacts, touchpointMap])

  // Filter
  const filtered = useMemo(() => {
    return enriched.filter(c => {
      const searchStr = `${c.fullName} ${c.email || ''} ${c.companyName} ${c.phone || ''}`.toLowerCase()
      if (search && !searchStr.includes(search.toLowerCase())) return false
      if (companyFilter && c.company_id !== companyFilter) return false
      if (statusFilter && c.status !== statusFilter) return false
      return true
    })
  }, [enriched, search, companyFilter, statusFilter])

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let valA, valB
      switch (sortKey) {
        case 'name':
          valA = a.fullName.toLowerCase(); valB = b.fullName.toLowerCase(); break
        case 'company':
          valA = a.companyName.toLowerCase(); valB = b.companyName.toLowerCase(); break
        case 'email':
          valA = (a.email || '').toLowerCase(); valB = (b.email || '').toLowerCase(); break
        case 'phone':
          valA = a.phone || ''; valB = b.phone || ''; break
        case 'status':
          valA = a.status; valB = b.status; break
        case 'lastActivity':
          valA = a.lastActivity || ''; valB = b.lastActivity || ''; break
        default:
          return 0
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-brand-cream/20" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-brand-lime" />
      : <ArrowDown className="h-3.5 w-3.5 text-brand-lime" />
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch { /* ignore */ }
  }

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Unique companies in contacts for filter dropdown
  const companyOptions = useMemo(() => {
    const map = new Map()
    contacts.forEach(c => {
      if (c.company_id && c.companies?.name) {
        map.set(c.company_id, c.companies.name)
      }
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [contacts])

  if (loading || companiesLoading || tpLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'lastActivity', label: 'Last Activity' },
  ]

  return (
    <div>
      {/* Header */}
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

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-brand-charcoal px-4 py-2 text-sm text-brand-cream placeholder-brand-cream/30 outline-none focus:border-brand-green"
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-brand-charcoal px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-green"
        >
          <option value="">All Companies</option>
          {companyOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-brand-charcoal px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-green"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="New">New</option>
        </select>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">
            {search || companyFilter || statusFilter
              ? 'No contacts match your filters.'
              : 'No contacts yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-brand-charcoal">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-brand-cream/50 transition-colors hover:text-brand-cream"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      <SortIcon column={col.key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-brand-cream/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map(contact => (
                <tr
                  key={contact.id}
                  onClick={() => setDrawerId(contact.id)}
                  className="group cursor-pointer bg-brand-black transition-colors hover:bg-brand-charcoal/80"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-brand-cream">{contact.fullName}</p>
                      {contact.job_title && (
                        <p className="text-xs text-brand-cream/40">{contact.job_title}</p>
                      )}
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3">
                    {contact.companyName ? (
                      <span className="text-brand-cream/70">{contact.companyName}</span>
                    ) : (
                      <span className="text-brand-cream/20">—</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    {contact.email ? (
                      <span className="inline-flex items-center gap-2">
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-cream/70 hover:text-brand-lime"
                        >
                          {contact.email}
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(contact.email, `email:${contact.id}`) }}
                          className="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer rounded p-0.5 text-brand-cream/30 hover:text-brand-lime"
                          title="Copy email"
                        >
                          {copiedId === `email:${contact.id}`
                            ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </span>
                    ) : (
                      <span className="text-brand-cream/20">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    {contact.phone ? (
                      <span className="inline-flex items-center gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-cream/70 hover:text-brand-lime"
                        >
                          {contact.phone}
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(contact.phone, `phone:${contact.id}`) }}
                          className="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer rounded p-0.5 text-brand-cream/30 hover:text-brand-lime"
                          title="Copy phone"
                        >
                          {copiedId === `phone:${contact.id}`
                            ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                            : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </span>
                    ) : (
                      <span className="text-brand-cream/20">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>

                  {/* Last Activity */}
                  <td className="px-4 py-3 text-brand-cream/50">
                    {formatDate(contact.lastActivity)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => openEdit(e, contact)}
                        className="rounded-lg p-1.5 text-brand-cream/40 hover:bg-white/10 hover:text-brand-cream cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact) }}
                        className="rounded-lg p-1.5 text-brand-cream/40 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <ContactDrawer
        contactId={drawerId}
        open={!!drawerId}
        onClose={() => setDrawerId(null)}
      />
    </div>
  )
}
