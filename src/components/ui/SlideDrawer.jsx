import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function SlideDrawer({ open, onClose, title, children }) {
  // Prevent background scroll when drawer is open, but keep list scrollable
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-brand-black shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-cream">{title}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-brand-cream/50 transition-colors hover:bg-white/10 hover:text-brand-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  )
}
