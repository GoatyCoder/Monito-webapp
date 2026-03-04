import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type FabScartoProps = {
  canEdit: boolean;
};

export function FabScarto({ canEdit }: FabScartoProps) {
  if (!canEdit) {
    return null;
  }

  return (
    <Button type="button" className="fixed bottom-4 right-4 rounded-full px-5 py-3 text-sm font-semibold shadow-lg">
      {/* FAB aggiornato con icona per enfatizzare l'azione di registrazione scarto. */}
      <Trash2 className="h-4 w-4" />
      Registra Scarto
    </Button>
  );
}
