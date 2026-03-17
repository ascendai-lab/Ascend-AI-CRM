const variants = {
  primary: 'bg-brand-green text-brand-cream hover:bg-brand-green/80',
  secondary: 'bg-white/5 text-brand-cream border border-white/10 hover:bg-white/10',
  danger: 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
