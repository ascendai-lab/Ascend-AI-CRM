import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')
    if (error) console.error('Error fetching companies:', error)
    else setCompanies(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const addCompany = async (company) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('companies')
      .insert({ ...company, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateCompany = async (id, updates) => {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setCompanies(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteCompany = async (id) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
    if (error) throw error
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  return { companies, loading, fetchCompanies, addCompany, updateCompany, deleteCompany }
}
