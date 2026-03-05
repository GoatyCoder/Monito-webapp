'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { EditWorkOrderModal } from '@/components/dashboard/edit-work-order-modal';
import { LineCard } from '@/components/dashboard/line-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { Button } from '@/components/ui/button';
import { OPS_SCHEMA } from '@/lib/config/db';
import {
  closeLavorazione,
  reopenLavorazione,
  startScheduledLavorazione,
  type DashboardData,
  type DashboardLavorazioneItem
} from '@/lib/db/queries/lavorazioni';
import { createSupabaseClient } from '@/lib/db/supabase-client';

type DashboardOverviewProps = {
  canEdit: boolean;
  dashboardData: DashboardData;
};

type ActionMode = 'close' | 'reopen';

export function DashboardOverview({ canEdit, dashboardData }: DashboardOverviewProps) {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseClient());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reasonModal, setReasonModal] = useState<{ lavorazione: DashboardLavorazioneItem; mode: ActionMode } | null>(null);
  const [reason, setReason] = useState('');
  const [editTarget, setEditTarget] = useState<DashboardLavorazioneItem | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-lavorazioni-realtime')
      .on('postgres_changes', { event: '*', schema: OPS_SCHEMA, table: 'lavorazioni' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: OPS_SCHEMA, table: 'pedane' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  const withUser = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Sessione non disponibile. Esegui nuovamente il login.');
    }

    return {
      userId: user.id,
      actorName: user.user_metadata?.full_name ?? user.email ?? 'Utente'
    };
  };

  const handleStartScheduled = async (lavorazioneId: string) => {
    try {
      setBusyId(lavorazioneId);
      setError('');
      await startScheduledLavorazione(supabase, { lavorazioneId }, await withUser());
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Errore durante l\'avvio della lavorazione programmata.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmReasonAction = async () => {
    if (!reasonModal) {
      return;
    }

    try {
      setBusyId(reasonModal.lavorazione.id);
      setError('');

      if (reasonModal.mode === 'close') {
        await closeLavorazione(
          supabase,
          { lavorazioneId: reasonModal.lavorazione.id, reason: reason.trim() || null },
          await withUser()
        );
      } else {
        await reopenLavorazione(
          supabase,
          { lavorazioneId: reasonModal.lavorazione.id, reason: reason.trim() || null },
          await withUser()
        );
      }

      setReasonModal(null);
      setReason('');
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Errore durante l\'operazione richiesta.');
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
            onClose={(lavorazioneId) => {
              const item = dashboardData.recenti.find((current) => current.id === lavorazioneId);
              if (item) {
                setReasonModal({ lavorazione: item, mode: 'close' });
              }
            }}
            onEdit={setEditTarget}
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
                <div className="flex flex-wrap gap-2">
                  {item.stato === 'terminata' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => setReasonModal({ lavorazione: item, mode: 'reopen' })}
                    >
                      {busyId === item.id ? 'Riapertura…' : 'Riapri'}
                    </Button>
                  ) : null}

                  {item.stato === 'in_corso' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setEditTarget(item)}>
                        Modifica
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === item.id}
                        onClick={() => setReasonModal({ lavorazione: item, mode: 'close' })}
                      >
                        {busyId === item.id ? 'Chiusura…' : 'Chiudi'}
                      </Button>
                    </>
                  ) : null}

                  {item.stato === 'programmata' ? (
                    <Button size="sm" disabled={busyId === item.id} onClick={() => void handleStartScheduled(item.id)}>
                      {busyId === item.id ? 'Avvio…' : 'Avvia'}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {reasonModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
          <div className="w-full bg-white p-4 md:max-w-lg md:rounded-lg md:p-6">
            <h3 className="text-lg font-semibold text-slate-900">{reasonModal.mode === 'close' ? 'Chiudi lavorazione' : 'Riapri lavorazione'}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {reasonModal.lavorazione.lineaNome} · {reasonModal.lavorazione.lottoLabel} · {reasonModal.lavorazione.articoloNome}
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Motivo (opzionale)
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setReasonModal(null);
                  setReason('');
                }}
              >
                Annulla
              </Button>
              <Button type="button" variant={reasonModal.mode === 'close' ? 'destructive' : 'default'} onClick={() => void confirmReasonAction()}>
                {reasonModal.mode === 'close' ? 'Conferma chiusura' : 'Conferma riapertura'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <EditWorkOrderModal
        lavorazione={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={() => {
          setEditTarget(null);
          router.refresh();
        }}
      />
    </>
  );
}
