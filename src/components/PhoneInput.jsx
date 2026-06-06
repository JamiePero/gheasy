import { AlertIcon } from './icons.jsx'

export default function PhoneInput({ value, onChange, error, hint, label = 'Recipient number' }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-fg">{label}</label>
      <div
        className={`flex items-stretch overflow-hidden rounded-2xl border bg-card transition-colors duration-200 ${
          error ? 'border-red-400 dark:border-red-500/70' : 'border-border focus-within:border-brand'
        }`}
      >
        <span className="flex items-center gap-1.5 border-r border-border px-3.5 text-sm font-semibold text-muted">
          <span className="text-base leading-none">🇬🇭</span>
          +233
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="024 123 4567"
          maxLength={14}
          className="w-full bg-transparent px-3.5 py-3.5 text-base font-semibold tracking-wide text-fg outline-none placeholder:font-normal placeholder:text-muted/50"
        />
      </div>
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertIcon className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">{hint || 'We’ll deliver the bundle to this number.'}</p>
      )}
    </div>
  )
}
