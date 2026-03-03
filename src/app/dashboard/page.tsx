import { FabScarto } from '@/components/common/fab-scarto';
import { LineCard } from '@/components/dashboard/line-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { NewWorkOrderForm } from '@/components/dashboard/new-work-order-form';
import { canManageProduction, getUserRoleFromMetadata } from '@/lib/auth/user';
import { createSupabaseServerClient } from '@/lib/db/supabase-server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const role = getUserRoleFromMetadata(user);
  const canEdit = canManageProduction(role);

  return (
    <section className="space-y-6">
      {/* Barra riepilogo sticky (placeholder dati). */}
      <SummaryBar />

      {/* Apertura lavorazione semplificata con convertitore data/DOY. */}
      <NewWorkOrderForm canEdit={canEdit} />

      {/* Griglia linee: placeholder statico per struttura UI. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LineCard state="inactive" canEdit={canEdit} />
        <LineCard state="active" canEdit={canEdit} />
        <LineCard state="multi" canEdit={canEdit} />
      </div>

      {/* FAB per scarto rapido (visibile solo Admin/Operatore). */}
      <FabScarto canEdit={canEdit} />
    </section>
  );
}
