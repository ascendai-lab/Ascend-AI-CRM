import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ChatFab from '../ai/ChatFab'
import ChatPanel from '../ai/ChatPanel'

export default function AppShell() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex h-screen bg-brand-black text-brand-cream">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      {!chatOpen && <ChatFab onClick={() => setChatOpen(true)} />}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
