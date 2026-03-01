import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Button UI riutilizzabile allineato al design system.
 * NOTE: versione leggera placeholder (API ispirata a shadcn/ui con `asChild`).
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  asChild?: boolean;
  href?: string;
};

const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white border border-primary',
  secondary: 'bg-surface text-secondary border border-secondary',
  ghost: 'bg-transparent text-secondary border border-transparent hover:bg-slate-100',
  danger: 'bg-error text-white border border-error'
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  asChild = false,
  href
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition';
  const classes = `${base} ${variantMap[variant]} ${className}`.trim();

  if (asChild && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {children}
    </button>
  );
}
