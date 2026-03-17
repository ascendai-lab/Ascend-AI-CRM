import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*, companies(id, name)')
      .order('first_name')
    if (error) console.error('Error fetching contacts:', error)
    else setContacts(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const addContact = async (contact) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contact, user_id: user.id })
      .select('*, companies(id, name)')
      .single()
    if (error) throw error
    setContacts(prev => [...prev, data].sort((a, b) => a.first_name.localeCompare(b.first_name)))
    return data
  }

  const updateContact = async (id, updates) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, companies(id, name)')
      .single()
    if (error) throw error
    setContacts(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteContact = async (id) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    if (error) throw error
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return { contacts, loading, fetchContacts, addContact, updateContact, deleteContact }
}
