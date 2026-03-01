export function SummaryBar() {
  return (
    <div className="sticky top-16 rounded-lg bg-primary p-4 text-white">
      {/*
        Riepilogo giornaliero placeholder.
        TODO: collegare aggregati realtime da Supabase.
      */}
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <p>Linee attive: <strong>0</strong></p>
        <p>Lavorazioni aperte: <strong>0</strong></p>
        <p>Pedane oggi: <strong>0</strong></p>
        <p>Colli oggi: <strong>0</strong></p>
        <p>Scarto oggi: <strong>0 kg</strong></p>
      </div>
    </div>
  );
}
