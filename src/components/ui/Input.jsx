export default function Input({ label, id, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-cream/70">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full rounded-lg border border-white/10 bg-brand-black px-3 py-2 text-sm text-brand-cream placeholder-brand-cream/30 outline-none transition-colors focus:border-brand-green focus:ring-1 focus:ring-brand-green"
        {...props}
      />
    </div>
  )
}
