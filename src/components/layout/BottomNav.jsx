import { LayoutDashboard, Users, Building2, Kanban, DollarSign } from 'lucide-react'
import NavItem from './NavItem'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-brand-charcoal bg-brand-black pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map((item) => (
        <NavItem key={item.to} {...item} mobile />
      ))}
    </nav>
  )
}
