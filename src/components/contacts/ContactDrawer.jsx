import { useState, useEffect } from 'react'
import {
  Plus, Phone, Mail, Building2, Calendar, MessageSquare,
  Video, Send, Loader2, ExternalLink
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTouchpoints } from '../../hooks/useTouchpoints'
import SlideDrawer from '../ui/SlideDrawer'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import TouchpointForm from './TouchpointForm'

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Video,
  text: MessageSquare,
}

const typeColors = {
  call: 'bg-blue-500/20 text-blue-400',
  email: 'bg-emerald-500/20 text-emerald-400',
  meeting: 'bg-purple-500/20 text-purple-400',
  text: 'bg-amber-500/20 text-amber-400',
}

export default function ContactDrawer({ contactId, open, onClose }) {
  const [contact, setContact] = useState(null)
  const [contactLoading, setContactLoading] = useState(true)
  const { touchpoints, loading: tpLoading, addTouchpoint } = useTouchpoints(contactId)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!contactId) return
    setContactLoading(true)
    const fetchContact = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, companies(id, name)')
        .eq('id', contactId)
        .single()
      if (error) {
        console.error('Error:', error)
      } else {
        setContact(data)
      }
      setContactLoading(false)
    }
    fetchContact()
  }, [contactId])

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

  const loading = contactLoading || tpLoading

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      title={loading ? 'Loading...' : contact ? `${contact.first_name} ${contact.last_name}` : 'Contact'}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
        </div>
      ) : !contact ? (
        <p className="text-brand-cream/50">Contact not found.</p>
      ) : (
        <>
          {/* Contact Info Card */}
          <div className="mb-6 rounded-xl border border-white/5 bg-brand-charcoal p-5">
            {contact.job_title && (
              <p className="mb-1 text-sm text-brand-cream/50">{contact.job_title}</p>
            )}
            {contact.companies?.name && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-green/20 px-2.5 py-0.5 text-xs text-brand-lime">
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

            <a
              href={`/contacts/${contactId}`}
              className="mt-4 inline-flex items-center gap-1 text-xs text-brand-cream/30 hover:text-brand-lime"
            >
              <ExternalLink className="h-3 w-3" /> Open full page
            </a>
          </div>

          {/* Touchpoints */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-cream">Touchpoints</h3>
            <Button onClick={() => setModalOpen(true)} className="text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {touchpoints.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-brand-charcoal p-6 text-center">
              <Send className="mx-auto mb-2 h-8 w-8 text-brand-cream/20" />
              <p className="text-sm text-brand-cream/50">No touchpoints yet.</p>
            </div>
          ) : (
            <div className="relative ml-3 border-l border-white/10 pl-5">
              {touchpoints.map((tp) => {
                const Icon = typeIcons[tp.type] || MessageSquare
                return (
                  <div key={tp.id} className="relative mb-3 last:mb-0">
                    <div className={`absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full ${typeColors[tp.type]}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="rounded-xl border border-white/5 bg-brand-charcoal p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase text-brand-cream/60">{tp.type}</span>
                          <span className="text-xs text-brand-cream/30">&middot;</span>
                          <span className="text-xs text-brand-cream/40">{tp.date}</span>
                        </div>
                        {tp.follow_up_date && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">
                            <Calendar className="h-3 w-3" /> {tp.follow_up_date}
                          </span>
                        )}
                      </div>
                      {tp.notes && (
                        <p className="mt-1.5 text-sm text-brand-cream/60">{tp.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Touchpoint add modal */}
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
        </>
      )}
    </SlideDrawer>
  )
}
