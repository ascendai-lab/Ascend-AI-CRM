import { LayoutDashboard, Users, Building2, Kanban, CheckSquare, DollarSign, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NavItem from './NavItem'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/services', icon: Settings, label: 'Services' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-brand-charcoal bg-brand-black">
      <div className="flex items-center gap-2 px-5 py-6">
        <img src="/logo.svg" alt="Ascend AI" className="h-8 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="border-t border-brand-charcoal px-4 py-4">
        <p className="mb-3 truncate text-xs text-brand-cream/50">
          {user?.email}
        </p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-cream/60 transition-colors hover:bg-white/5 hover:text-brand-cream cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  )
}
