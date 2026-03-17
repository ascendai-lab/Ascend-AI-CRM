import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useClientServices(companyId) {
  const [clientServices, setClientServices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClientServices = useCallback(async () => {
    if (!companyId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('client_services')
      .select('*, services(id, name, type, default_price)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching client services:', error)
    else setClientServices(data)
    setLoading(false)
  }, [companyId])

  useEffect(() => { fetchClientServices() }, [fetchClientServices])

  const addClientService = async (clientService) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('client_services')
      .insert({ ...clientService, company_id: companyId, user_id: user.id })
      .select('*, services(id, name, type, default_price)')
      .single()
    if (error) throw error
    setClientServices(prev => [data, ...prev])
    return data
  }

  const updateClientService = async (id, updates) => {
    const { data, error } = await supabase
      .from('client_services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, services(id, name, type, default_price)')
      .single()
    if (error) throw error
    setClientServices(prev => prev.map(cs => cs.id === id ? data : cs))
    return data
  }

  const deleteClientService = async (id) => {
    const { error } = await supabase
      .from('client_services')
      .delete()
      .eq('id', id)
    if (error) throw error
    setClientServices(prev => prev.filter(cs => cs.id !== id))
  }

  return { clientServices, loading, fetchClientServices, addClientService, updateClientService, deleteClientService }
}

export function useAllClientServices() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: result, error } = await supabase
      .from('client_services')
      .select('*, services(id, name, type, default_price), companies(id, name)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching all client services:', error)
    else setData(result)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { allClientServices: data, loading, refetch: fetch }
}
