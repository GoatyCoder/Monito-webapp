'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { NewWorkOrderModal } from '@/components/dashboard/new-work-order-modal';
import { Button } from '@/components/ui/button';

type DashboardActionsProps = {
  canEdit: boolean;
};

export function DashboardActions({ canEdit }: DashboardActionsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuova lavorazione
        </Button>
      </div>

      <NewWorkOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
