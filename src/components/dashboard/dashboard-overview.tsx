'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { LineCard } from '@/components/dashboard/line-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { Button } from '@/components/ui/button';
import { closeLavorazione, reopenLavorazione, type DashboardData } from '@/lib/db/queries/lavorazioni';
import { createSupabaseClient } from '@/lib/db/supabase-client';

type DashboardOverviewProps = {
  canEdit: boolean;
  dashboardData: DashboardData;
};

export function DashboardOverview({ canEdit, dashboardData }: DashboardOverviewProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleClose = async (lavorazioneId: string) => {
    try {
      setBusyId(lavorazioneId);
      setError('');
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Sessione non disponibile. Esegui nuovamente il login.');
      }

      await closeLavorazione(supabase, { lavorazioneId }, { userId: user.id, actorName: user.user_metadata?.full_name ?? user.email ?? 'Utente' });
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Errore durante la chiusura della lavorazione.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReopen = async (lavorazioneId: string) => {
    try {
      setBusyId(lavorazioneId);
      setError('');
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Sessione non disponibile. Esegui nuovamente il login.');
      }

      await reopenLavorazione(supabase, { lavorazioneId }, { userId: user.id, actorName: user.user_metadata?.full_name ?? user.email ?? 'Utente' });
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Errore durante la riapertura della lavorazione.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <SummaryBar summary={dashboardData.summary} />

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardData.linee.map((linea) => (
          <LineCard
            key={linea.id}
            lineName={linea.nome}
            lavorazioni={linea.lavorazioni}
            canEdit={canEdit}
            busyId={busyId}
            onClose={handleClose}
          />
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Gestione lavorazioni</h2>
        <div className="space-y-2">
          {dashboardData.recenti.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.lineaNome} · {item.lottoLabel}
                </p>
                <p className="text-xs text-slate-600">
                  {item.articoloNome} · {item.pedaneCount} pedane · {item.colliTotali} colli · {item.pesoTotaleKg.toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg
                </p>
              </div>
              {canEdit ? (
                item.stato === 'terminata' ? (
                  <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => handleReopen(item.id)}>
                    {busyId === item.id ? 'Riapertura…' : 'Riapri'}
                  </Button>
                ) : item.stato === 'in_corso' ? (
                  <Button size="sm" variant="destructive" disabled={busyId === item.id} onClick={() => handleClose(item.id)}>
                    {busyId === item.id ? 'Chiusura…' : 'Chiudi'}
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">Programmata</span>
                )
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
