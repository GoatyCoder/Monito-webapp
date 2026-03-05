import { FabScarto } from '@/components/common/fab-scarto';
import { DashboardActions } from '@/components/dashboard/dashboard-actions';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { canManageProduction, getUserRoleFromMetadata } from '@/lib/auth/user';
import { fetchDashboardData } from '@/lib/db/queries/lavorazioni';
import { createSupabaseServerClient } from '@/lib/db/supabase-server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const role = getUserRoleFromMetadata(user);
  const canEdit = canManageProduction(role);
  const dashboardData = await fetchDashboardData(supabase);

  return (
    <section className="space-y-6">
      <DashboardOverview canEdit={canEdit} dashboardData={dashboardData} />
      <DashboardActions canEdit={canEdit} />
      <FabScarto canEdit={canEdit} />
    </section>
  );
}
