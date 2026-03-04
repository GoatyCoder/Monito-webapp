import { ReactNode } from 'react';

type SheetProps = { children: ReactNode };

// Componente placeholder shadcn/ui compatibile per uso futuro.
export function Sheet({ children }: SheetProps) {
  return <>{children}</>;
}
