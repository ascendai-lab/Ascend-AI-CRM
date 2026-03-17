import { Navigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SplashPage() {
  const { session, loading, signInWithGoogle } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-black" />
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-brand-black px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <img
          src="/logo.svg"
          alt="Ascend AI Marketing"
          className="mb-8 h-16 w-auto"
        />

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-brand-cream">
          Ascend AI CRM
        </h1>

        <p className="mb-10 text-lg text-brand-cream/60">
          Your business. Organized.
        </p>

        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 rounded-lg bg-brand-green px-8 py-3 text-base font-medium text-brand-cream transition-colors hover:bg-brand-green/80 cursor-pointer"
        >
          <LogIn className="h-5 w-5" />
          Login with Google
        </button>
      </div>
    </div>
  )
}
