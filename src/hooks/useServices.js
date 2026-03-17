import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name')
    if (error) console.error('Error fetching services:', error)
    else setServices(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const addService = async (service) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setServices(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateService = async (id, updates) => {
    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setServices(prev => prev.map(s => s.id === id ? data : s))
    return data
  }

  const deleteService = async (id) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
    if (error) throw error
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const seedDefaults = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const defaults = [
      { name: 'Website Build', type: 'one-time', default_price: 2500 },
      { name: 'Local SEO', type: 'recurring', default_price: 500 },
      { name: 'Social Media Management', type: 'recurring', default_price: 750 },
      { name: 'Organic Posting', type: 'recurring', default_price: 400 },
      { name: 'Website Maintenance', type: 'recurring', default_price: 150 },
      { name: 'Consultation', type: 'one-time', default_price: 200 },
    ]
    const { data, error } = await supabase
      .from('services')
      .insert(defaults.map(s => ({ ...s, user_id: user.id })))
      .select()
    if (error) throw error
    setServices(data.sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  return { services, loading, fetchServices, addService, updateService, deleteService, seedDefaults }
}
