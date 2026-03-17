import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*, companies(id, name), contacts(id, first_name, last_name)')
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching deals:', error)
    else setDeals(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const addDeal = async (deal) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('deals')
      .insert({ ...deal, user_id: user.id })
      .select('*, companies(id, name), contacts(id, first_name, last_name)')
      .single()
    if (error) throw error
    setDeals(prev => [data, ...prev])
    return data
  }

  const updateDeal = async (id, updates) => {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, companies(id, name), contacts(id, first_name, last_name)')
      .single()
    if (error) throw error
    setDeals(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  const deleteDeal = async (id) => {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) throw error
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const moveDeal = async (id, newStage) => {
    return updateDeal(id, { stage: newStage })
  }

  return { deals, loading, fetchDeals, addDeal, updateDeal, deleteDeal, moveDeal }
}
