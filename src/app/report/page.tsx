export default function ReportPage() {
  return (
    <section className="space-y-4">
      {/* Header sezione report. */}
      <h1 className="text-2xl font-semibold">Report</h1>
      <p className="text-secondary">Placeholder per filtri data, tab e export (PDF/Excel/CSV).</p>

      {/* Contenitore tabella report (solo scheletro). */}
      <div className="rounded-lg border border-slate-200 bg-surface p-4 shadow-sm">
        <p className="text-sm text-secondary">TODO: integrare dataset e tab per Lotto/Linea/Articolo.</p>
      </div>
    </section>
  );
}
