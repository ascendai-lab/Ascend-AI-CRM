import { Bot } from 'lucide-react'

export default function ChatFab({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-6 z-40 cursor-pointer rounded-full bg-brand-green p-4 text-brand-cream shadow-lg shadow-brand-green/20 transition-all hover:scale-105 hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/30 md:bottom-6"
      aria-label="Open AI Chat"
    >
      <Bot className="h-6 w-6" />
    </button>
  )
}
