import { NavLink } from 'react-router-dom'

export default function NavItem({ to, icon: Icon, label, mobile }) {
  if (mobile) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
            isActive ? 'text-brand-lime' : 'text-brand-cream/50 hover:text-brand-cream/80'
          }`
        }
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </NavLink>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-green/20 text-brand-lime'
            : 'text-brand-cream/60 hover:bg-white/5 hover:text-brand-cream'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  )
}
