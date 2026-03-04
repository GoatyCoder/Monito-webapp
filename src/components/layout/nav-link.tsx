'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`border-b-2 pb-1 transition ${isActive ? 'border-primary font-semibold text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
    >
      {label}
    </Link>
  );
}
