import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTouchpoints(contactId) {
  const [touchpoints, setTouchpoints] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTouchpoints = useCallback(async () => {
    if (!contactId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('touchpoints')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false })
    if (error) console.error('Error fetching touchpoints:', error)
    else setTouchpoints(data)
    setLoading(false)
  }, [contactId])

  useEffect(() => { fetchTouchpoints() }, [fetchTouchpoints])

  const addTouchpoint = async (tp) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('touchpoints')
      .insert({ ...tp, contact_id: contactId, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setTouchpoints(prev => [data, ...prev])
    return data
  }

  return { touchpoints, loading, fetchTouchpoints, addTouchpoint }
}
