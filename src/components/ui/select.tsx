import { ChangeEventHandler, SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}

export type SelectChangeHandler = ChangeEventHandler<HTMLSelectElement>;
