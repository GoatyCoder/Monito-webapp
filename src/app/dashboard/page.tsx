import { FabScarto } from '@/components/common/fab-scarto';
import { LineCard } from '@/components/dashboard/line-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      {/* Barra riepilogo sticky (placeholder dati). */}
      <SummaryBar />

      {/* Griglia linee: placeholder statico per struttura UI. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LineCard state="inactive" />
        <LineCard state="active" />
        <LineCard state="multi" />
      </div>

      {/* FAB per scarto rapido (visibilità ruoli da implementare). */}
      <FabScarto />
    </section>
  );
}
