import { DollarSign, TrendingUp, Building2, Loader2 } from 'lucide-react'
import { useAllClientServices } from '../hooks/useClientServices'
import { useNavigate } from 'react-router-dom'

export default function RevenuePage() {
  const { allClientServices, loading } = useAllClientServices()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-lime" />
      </div>
    )
  }

  const getPrice = (cs) => cs.custom_price !== null ? cs.custom_price : cs.services?.default_price || 0

  const activeRecurring = allClientServices.filter(
    cs => cs.status === 'active' && cs.services?.type === 'recurring'
  )

  const totalMRR = activeRecurring.reduce((sum, cs) => sum + Number(getPrice(cs)), 0)

  // Group by company
  const byCompany = {}
  activeRecurring.forEach(cs => {
    const companyId = cs.company_id
    const companyName = cs.companies?.name || 'Unknown'
    if (!byCompany[companyId]) {
      byCompany[companyId] = { id: companyId, name: companyName, mrr: 0, services: [] }
    }
    byCompany[companyId].mrr += Number(getPrice(cs))
    byCompany[companyId].services.push(cs)
  })

  const companySummaries = Object.values(byCompany).sort((a, b) => b.mrr - a.mrr)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-cream">Revenue</h1>
        <p className="mt-1 text-sm text-brand-cream/50">All clients recurring revenue summary</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/30 text-brand-lime">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-brand-cream/60">Total MRR</p>
              <p className="text-2xl font-bold text-brand-lime">${totalMRR.toFixed(2)}<span className="text-sm font-normal text-brand-cream/40">/mo</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/20 text-brand-lime">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-brand-cream/60">Projected Annual</p>
              <p className="text-2xl font-bold text-brand-cream">${(totalMRR * 12).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-brand-cream">Revenue by Client</h2>

      {companySummaries.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-brand-charcoal p-8 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-brand-cream/20" />
          <p className="text-brand-cream/50">No active recurring services yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {companySummaries.map(company => (
            <div
              key={company.id}
              onClick={() => navigate(`/companies/${company.id}`)}
              className="cursor-pointer rounded-xl border border-white/5 bg-brand-charcoal p-4 transition-colors hover:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-brand-cream">{company.name}</h3>
                  <p className="text-xs text-brand-cream/40">
                    {company.services.length} active recurring service{company.services.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-lime">${company.mrr.toFixed(2)}</p>
                  <p className="text-xs text-brand-cream/40">/month</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {company.services.map(cs => (
                  <span key={cs.id} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-brand-cream/50">
                    {cs.services?.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
