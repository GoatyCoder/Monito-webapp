import { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'accent';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-white',
  secondary: 'bg-slate-200 text-slate-700',
  success: 'bg-success/15 text-success',
  accent: 'bg-accent/20 text-amber-700'
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
