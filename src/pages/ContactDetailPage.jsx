import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Phone, Mail, Building2, Calendar, MessageSquare, Users, Send, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTouchpoints } from '../hooks/useTouchpoints'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import TouchpointForm from '../components/contacts/TouchpointForm'

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Users,
  text: MessageSquare,
}

const typeColors = {
  call: 'bg-blue-500/20 text-blue-400',
  email: 'bg-emerald-500/20 text-emerald-400',
  meeting: 'bg-amber-500/20 text-amber-400',
  text: 'bg-purple-500/20 text-purple-400',
}

export default function ContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [contactLoading, setContactLoading] = useState(true)
  const { touchpoints, loading: tpLoading, addTouchpoint } = useTouchpoints(id)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchContact = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, companies(id, name)')
        .eq('id', id)
        .single()
      if (error) {
        console.error('Error:', error)
        navigate('/contacts')
      } else {
        setContact(data)
      }
      setContactLoading(false)
    }
    fetchContact()
  }, [id, navigate])

  const handleSubmit = async (form) => {
    setSaving(true)
    try {
      await addTouchpoint(form)
      setModalOpen(false)
    } catch (err) {
      console.error('Error adding touchpoint:', err)
    }
    setSaving(false)
  }

  if (contactLoading || tpLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  if (!contact) return null

  return (
    <div>
      <button
        onClick={() => navigate('/contacts')}
        className="mb-4 flex items-center gap-2 text-sm text-brand-cream/50 hover:text-brand-cream cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </button>

      <div className="mb-6 rounded-xl border border-white/5 bg-brand-charcoal p-5">
        <h1 className="text-2xl font-bold text-brand-cream">
          {contact.first_name} {contact.last_name}
        </h1>
        {contact.job_title && (
          <p className="mt-0.5 text-sm text-brand-cream/50">{contact.job_title}</p>
        )}
        {contact.companies?.name && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
            <Building2 className="h-3 w-3" /> {contact.companies.name}
          </span>
        )}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-cream/40">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-brand-lime">
              <Mail className="h-3.5 w-3.5" /> {contact.email}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-brand-lime">
              <Phone className="h-3.5 w-3.5" /> {contact.phone}
            </a>
          )}
        </div>
        {contact.notes && <p className="mt-3 text-sm text-brand-cream/40">{contact.notes}</p>}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-cream">Touchpoints</h2>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Touchpoint
        </Button>
      </div>

      {touchpoints.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-8 text-center">
          <Send className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">No touchpoints yet. Log your first interaction!</p>
        </div>
      ) : (
        <div className="relative ml-4 border-l border-white/10 pl-6">
          {touchpoints.map((tp) => {
            const Icon = typeIcons[tp.type] || MessageSquare
            return (
              <div key={tp.id} className="relative mb-4 last:mb-0">
                <div className={`absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ${typeColors[tp.type]}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="rounded-xl border border-white/5 bg-brand-charcoal p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase text-brand-cream/60">{tp.type}</span>
                      <span className="text-xs text-brand-cream/30">&middot;</span>
                      <span className="text-xs text-brand-cream/40">{tp.date}</span>
                    </div>
                    {tp.follow_up_date && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">
                        <Calendar className="h-3 w-3" /> Follow up: {tp.follow_up_date}
                      </span>
                    )}
                  </div>
                  {tp.notes && (
                    <p className="mt-2 text-sm text-brand-cream/60">{tp.notes}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Touchpoint"
      >
        <TouchpointForm
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
