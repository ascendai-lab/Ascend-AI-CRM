import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, contacts(id, first_name, last_name), deals(id, name)')
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) console.error('Error fetching tasks:', error)
    else setTasks(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const addTask = async (task) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
      .select('*, contacts(id, first_name, last_name), deals(id, name)')
      .single()
    if (error) throw error
    setTasks(prev => [...prev, data])
    return data
  }

  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, contacts(id, first_name, last_name), deals(id, name)')
      .single()
    if (error) throw error
    setTasks(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const toggleTask = async (id, completed) => {
    return updateTask(id, { completed })
  }

  return { tasks, loading, fetchTasks, addTask, updateTask, deleteTask, toggleTask }
}
