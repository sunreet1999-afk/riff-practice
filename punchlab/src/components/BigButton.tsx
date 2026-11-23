import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink active:brightness-90',
  ghost: 'border border-line text-ink active:bg-surface',
}

/** Full-width button with a tap target of at least 56px. */
export function BigButton({ variant = 'primary', className = '', ...rest }: BigButtonProps) {
  return (
    <button
      type="button"
      className={`min-h-14 w-full rounded-2xl px-5 text-lg font-semibold transition disabled:opacity-40 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
