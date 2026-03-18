import { useState, useEffect, useRef } from 'react'
import { Plus, Users, Building2, CheckSquare, Briefcase } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import ContactForm from '../contacts/ContactForm'
import CompanyForm from '../companies/CompanyForm'
import TaskForm from '../tasks/TaskForm'
import DealForm from '../pipeline/DealForm'

const menuItems = [
  { key: 'contact', label: 'New Contact', icon: Users },
  { key: 'company', label: 'New Company', icon: Building2 },
  { key: 'task', label: 'New Task', icon: CheckSquare },
  { key: 'deal', label: 'New Deal', icon: Briefcase },
]

export default function QuickCreate() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeForm, setActiveForm] = useState(null) // 'contact' | 'company' | 'task' | 'deal'
  const [saving, setSaving] = useState(false)
  const menuRef = useRef(null)

  // Lookup data — loaded lazily when a form opens
  const [companies, setCompanies] = useState([])
  const [contacts, setContacts] = useState([])
  const [deals, setDeals] = useState([])

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Fetch lookup data when a form opens that needs it
  useEffect(() => {
    if (!activeForm) return

    const fetchLookups = async () => {
      if (['contact', 'deal'].includes(activeForm)) {
        const { data } = await supabase.from('companies').select('id, name').order('name')
        setCompanies(data || [])
      }
      if (['task', 'deal'].includes(activeForm)) {
        const { data } = await supabase.from('contacts').select('id, first_name, last_name').order('first_name')
        setContacts(data || [])
      }
      if (activeForm === 'task') {
        const { data } = await supabase.from('deals').select('id, name').order('name')
        setDeals(data || [])
      }
    }
    fetchLookups()
  }, [activeForm])

  const openForm = (key) => {
    setMenuOpen(false)
    setActiveForm(key)
  }

  const closeForm = () => {
    setActiveForm(null)
    setSaving(false)
  }

  const handleContactSubmit = async (form) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('contacts').insert({ ...form, user_id: user.id })
      closeForm()
    } catch (err) {
      console.error('Error creating contact:', err)
      setSaving(false)
    }
  }

  const handleCompanySubmit = async (form) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('companies').insert({ ...form, user_id: user.id })
      closeForm()
    } catch (err) {
      console.error('Error creating company:', err)
      setSaving(false)
    }
  }

  const handleTaskSubmit = async (form) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('tasks').insert({ ...form, user_id: user.id })
      closeForm()
    } catch (err) {
      console.error('Error creating task:', err)
      setSaving(false)
    }
  }

  const handleDealSubmit = async (form) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('deals').insert({ ...form, user_id: user.id })
      closeForm()
    } catch (err) {
      console.error('Error creating deal:', err)
      setSaving(false)
    }
  }

  const modalTitles = {
    contact: 'New Contact',
    company: 'New Company',
    task: 'New Task',
    deal: 'New Deal',
  }

  return (
    <>
      {/* Button + Dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-brand-green text-brand-cream transition-colors hover:bg-brand-green/80"
          title="Quick create"
        >
          <Plus className={`h-5 w-5 transition-transform duration-200 ${menuOpen ? 'rotate-45' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-brand-charcoal shadow-2xl">
            {menuItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => openForm(key)}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-brand-cream/70 transition-colors hover:bg-white/5 hover:text-brand-cream"
              >
                <Icon className="h-4 w-4 text-brand-lime" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <Modal open={activeForm === 'contact'} onClose={closeForm} title={modalTitles.contact}>
        <ContactForm
          contact={null}
          companies={companies}
          onSubmit={handleContactSubmit}
          onCancel={closeForm}
          loading={saving}
        />
      </Modal>

      {/* Company Modal */}
      <Modal open={activeForm === 'company'} onClose={closeForm} title={modalTitles.company}>
        <CompanyForm
          company={null}
          onSubmit={handleCompanySubmit}
          onCancel={closeForm}
          loading={saving}
        />
      </Modal>

      {/* Task Modal */}
      <Modal open={activeForm === 'task'} onClose={closeForm} title={modalTitles.task}>
        <TaskForm
          task={null}
          contacts={contacts}
          deals={deals}
          onSubmit={handleTaskSubmit}
          onCancel={closeForm}
          loading={saving}
        />
      </Modal>

      {/* Deal Modal */}
      <Modal open={activeForm === 'deal'} onClose={closeForm} title={modalTitles.deal}>
        <DealForm
          deal={null}
          companies={companies}
          contacts={contacts}
          onSubmit={handleDealSubmit}
          onCancel={closeForm}
          loading={saving}
        />
      </Modal>
    </>
  )
}
