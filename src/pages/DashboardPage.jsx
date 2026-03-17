import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, Users, Briefcase, CheckSquare, Clock, Building2,
  TrendingUp, Square, CheckSquare2, Loader2, ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    mrr: 0,
    activeClients: 0,
    openDeals: 0,
    pipelineValue: 0,
    tasksDueToday: [],
    recentTouchpoints: [],
    recentCompanies: [],
  })

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [
        clientServicesRes,
        dealsRes,
        tasksRes,
        touchpointsRes,
        companiesRes,
      ] = await Promise.all([
        // Active recurring client services with company names
        supabase
          .from('client_services')
          .select('custom_price, services(default_price, type), companies(id, name)')
          .eq('status', 'active'),
        // All deals
        supabase
          .from('deals')
          .select('stage, value'),
        // Tasks due today
        supabase
          .from('tasks')
          .select('*, contacts(id, first_name, last_name), deals(id, name)')
          .eq('due_date', new Date().toISOString().split('T')[0])
          .eq('completed', false)
          .order('created_at', { ascending: true }),
        // Recent touchpoints
        supabase
          .from('touchpoints')
          .select('*, contacts(id, first_name, last_name)')
          .order('date', { ascending: false })
          .limit(5),
        // Recent companies (by updated_at or created_at)
        supabase
          .from('companies')
          .select('id, name, industry')
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      // Calculate MRR from active recurring services
      let mrr = 0
      const activeCompanyIds = new Set()
      if (clientServicesRes.data) {
        clientServicesRes.data.forEach(cs => {
          if (cs.services?.type === 'recurring') {
            const price = cs.custom_price ?? cs.services.default_price ?? 0
            mrr += Number(price)
          }
          if (cs.companies?.id) {
            activeCompanyIds.add(cs.companies.id)
          }
        })
      }

      // Calculate open deals and pipeline value
      let openDeals = 0
      let pipelineValue = 0
      if (dealsRes.data) {
        dealsRes.data.forEach(d => {
          if (!['Closed Won', 'Closed Lost'].includes(d.stage)) {
            openDeals++
            pipelineValue += Number(d.value || 0)
          }
        })
      }

      setStats({
        mrr,
        activeClients: activeCompanyIds.size,
        openDeals,
        pipelineValue,
        tasksDueToday: tasksRes.data || [],
        recentTouchpoints: touchpointsRes.data || [],
        recentCompanies: companiesRes.data || [],
      })
    } catch (err) {
      console.error('Error fetching dashboard:', err)
    }
    setLoading(false)
  }

  const toggleTask = async (taskId, completed) => {
    await supabase
      .from('tasks')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    setStats(prev => ({
      ...prev,
      tasksDueToday: prev.tasksDueToday.filter(t => t.id !== taskId),
    }))
  }

  const touchpointTypeLabel = {
    call: '📞 Call',
    email: '✉️ Email',
    meeting: '🤝 Meeting',
    text: '💬 Text',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-cream">Dashboard</h1>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Monthly Recurring Revenue"
          value={`$${stats.mrr.toLocaleString()}`}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Users}
          label="Active Clients"
          value={stats.activeClients}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Briefcase}
          label="Open Deals"
          value={stats.openDeals}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Pipeline Value"
          value={`$${stats.pipelineValue.toLocaleString()}`}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Two-column layout for tasks and touchpoints */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tasks Due Today */}
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-cream/70">
              <CheckSquare className="h-4 w-4" />
              Tasks Due Today
            </h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-brand-cream/40 hover:text-brand-lime cursor-pointer"
            >
              View all →
            </button>
          </div>
          {stats.tasksDueToday.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-cream/30">No tasks due today 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.tasksDueToday.map(task => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg bg-brand-black/50 px-3 py-2.5">
                  <button
                    onClick={() => toggleTask(task.id, true)}
                    className="shrink-0 cursor-pointer text-brand-cream/40 hover:text-brand-lime"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-brand-cream">{task.title}</p>
                    {task.contacts && (
                      <p className="text-[11px] text-brand-cream/40">
                        {task.contacts.first_name} {task.contacts.last_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Touchpoints */}
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-cream/70">
              <Clock className="h-4 w-4" />
              Recent Touchpoints
            </h2>
            <button
              onClick={() => navigate('/contacts')}
              className="text-xs text-brand-cream/40 hover:text-brand-lime cursor-pointer"
            >
              View contacts →
            </button>
          </div>
          {stats.recentTouchpoints.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-cream/30">No touchpoints yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentTouchpoints.map(tp => (
                <div
                  key={tp.id}
                  onClick={() => tp.contacts?.id && navigate(`/contacts/${tp.contacts.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-brand-black/50 px-3 py-2.5 hover:bg-brand-black/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{touchpointTypeLabel[tp.type] || tp.type}</span>
                    <span className="text-sm text-brand-cream">
                      {tp.contacts ? `${tp.contacts.first_name} ${tp.contacts.last_name}` : 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs text-brand-cream/30">{tp.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access — Recent Companies */}
      <div className="rounded-xl border border-white/5 bg-brand-charcoal p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-cream/70">
            <Building2 className="h-4 w-4" />
            Quick Access
          </h2>
          <button
            onClick={() => navigate('/companies')}
            className="text-xs text-brand-cream/40 hover:text-brand-lime cursor-pointer"
          >
            View all →
          </button>
        </div>
        {stats.recentCompanies.length === 0 ? (
          <p className="py-4 text-center text-sm text-brand-cream/30">No companies yet</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.recentCompanies.map(company => (
              <button
                key={company.id}
                onClick={() => navigate(`/companies/${company.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-brand-black/50 p-4 text-left transition-colors hover:bg-brand-black/80"
              >
                <div>
                  <p className="text-sm font-medium text-brand-cream">{company.name}</p>
                  {company.industry && (
                    <p className="mt-0.5 text-xs text-brand-cream/40">{company.industry}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-brand-cream/20" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-xl border border-white/5 bg-brand-charcoal p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-brand-cream/50">{label}</p>
          <p className="text-xl font-bold text-brand-cream">{value}</p>
        </div>
      </div>
    </div>
  )
}
