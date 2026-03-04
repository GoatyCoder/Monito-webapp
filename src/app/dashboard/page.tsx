'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { FabScarto } from '@/components/common/fab-scarto';
import { LineCard } from '@/components/dashboard/line-card';
import { NewWorkOrderModal } from '@/components/dashboard/new-work-order-modal';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { Button } from '@/components/ui/button';
import { canManageProduction, getUserRoleFromMetadata } from '@/lib/auth/user';
import { createSupabaseClient } from '@/lib/db/supabase-client';
import type { Lavorazione } from '@/types/domain';

export default function DashboardPage() {
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      const supabase = createSupabaseClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      const role = getUserRoleFromMetadata(user);
      setCanEdit(canManageProduction(role));
    }

    loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSuccess(_: Lavorazione) {
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <SummaryBar />

      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuova lavorazione
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LineCard state="inactive" canEdit={canEdit} />
        <LineCard state="active" canEdit={canEdit} />
        <LineCard state="multi" canEdit={canEdit} />
      </div>

      <FabScarto canEdit={canEdit} />

      <NewWorkOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </section>
  );
}
