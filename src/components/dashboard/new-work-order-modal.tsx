'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { canManageProduction, getUserRoleFromMetadata } from '@/lib/auth/user';
import { createSupabaseClient } from '@/lib/db/supabase-client';
import {
  createLavorazione,
  fetchNewWorkOrderFormData,
  type WorkOrderFormData
} from '@/lib/db/queries/lavorazioni';
import { dateFromDayOfYear, dayOfYearFromDate } from '@/lib/utils/date';
import type { Lavorazione } from '@/types/domain';

type NewWorkOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lavorazione: Lavorazione) => void;
  formData?: WorkOrderFormData | null;
};

type SubmitMode = 'schedule' | 'open';

type FormErrors = {
  lineaId?: string;
  siglaLottoId?: string;
  dataIngresso?: string;
  lottoIngresso?: string;
  articoloId?: string;
  pesoPerCollo?: string;
  imballaggioSecondarioId?: string;
};

export function NewWorkOrderModal({ isOpen, onClose, onSuccess, formData }: NewWorkOrderModalProps) {
  const [supabase] = useState(() => createSupabaseClient());
  const [resolvedFormData, setResolvedFormData] = useState<WorkOrderFormData | null>(formData ?? null);
  const [lineaId, setLineaId] = useState('');
  const [siglaLottoId, setSiglaLottoId] = useState('');
  const [dataIngresso, setDataIngresso] = useState('');
  const [lottoIngresso, setLottoIngresso] = useState('');
  const [articoloId, setArticoloId] = useState('');
  const [imballaggioSecondarioId, setImballaggioSecondarioId] = useState('');
  const [pesoPerCollo, setPesoPerCollo] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [footerError, setFooterError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null);

  useEffect(() => {
    setResolvedFormData(formData ?? null);
  }, [formData]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (formData) {
      return;
    }

    let isCancelled = false;

    const loadFormData = async () => {
      setIsLoadingData(true);
      setFooterError('');
      try {
        const nextData = await fetchNewWorkOrderFormData(supabase);
        if (!isCancelled) {
          setResolvedFormData(nextData);
        }
      } catch (error) {
        if (!isCancelled) {
          setFooterError(error instanceof Error ? error.message : 'Errore durante il caricamento del form.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    };

    void loadFormData();

    return () => {
      isCancelled = true;
    };
  }, [formData, isOpen, supabase]);

  const selectedSiglaLotto = useMemo(
    () => resolvedFormData?.sigleLotto.find((item) => item.id === siglaLottoId) ?? null,
    [resolvedFormData, siglaLottoId]
  );

  const filteredArticoli = useMemo(() => {
    if (!resolvedFormData) {
      return [];
    }

    if (!selectedSiglaLotto) {
      return resolvedFormData.articoli;
    }

    return resolvedFormData.articoli.filter(
      (articolo) =>
        articolo.vincoloProdottoGrezzoId === selectedSiglaLotto.prodottoGrezzoId || articolo.vincoloProdottoGrezzoId === null
    );
  }, [resolvedFormData, selectedSiglaLotto]);

  const selectedArticolo = useMemo(
    () => resolvedFormData?.articoli.find((item) => item.id === articoloId) ?? null,
    [resolvedFormData, articoloId]
  );

  const lineWarning = useMemo(() => {
    if (!lineaId || !resolvedFormData) {
      return false;
    }

    return resolvedFormData.lavorazioniInCorso.some((item) => item.lineaId === lineaId);
  }, [lineaId, resolvedFormData]);

  const isSaving = submitMode !== null;

  const resetFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!lineaId) {
      nextErrors.lineaId = 'Seleziona una linea.';
    }

    if (!siglaLottoId) {
      nextErrors.siglaLottoId = 'Seleziona una sigla lotto.';
    }

    const parsedDoy = Number(lottoIngresso);
    const normalizedDate = dayOfYearFromDate(dataIngresso);

    if (!dataIngresso || normalizedDate === null) {
      nextErrors.dataIngresso = 'Inserisci una data valida.';
    }

    if (!lottoIngresso || !Number.isInteger(parsedDoy) || parsedDoy < 1 || parsedDoy > 366) {
      nextErrors.lottoIngresso = 'Inserisci un DOY tra 1 e 366.';
    }

    if (!articoloId) {
      nextErrors.articoloId = 'Seleziona un articolo.';
    }

    const parsedPeso = Number(pesoPerCollo);
    if (!pesoPerCollo || Number.isNaN(parsedPeso) || parsedPeso <= 0) {
      nextErrors.pesoPerCollo = 'Inserisci un peso per collo maggiore di zero.';
    }

    if (!imballaggioSecondarioId) {
      nextErrors.imballaggioSecondarioId = 'Seleziona un imballaggio secondario.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (mode: SubmitMode) => {
    setFooterError('');
    if (!validate()) {
      return;
    }

    if (lineWarning) {
      const confirmed = window.confirm("La linea selezionata ha già una lavorazione aperta. Confermi l'apertura di una multi-lavorazione?");
      if (!confirmed) {
        return;
      }
    }

    setSubmitMode(mode);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(userError?.message ?? 'Utente non autenticato.');
      }

      const role = getUserRoleFromMetadata(user);
      if (!canManageProduction(role)) {
        throw new Error('Non hai i permessi necessari per creare una lavorazione.');
      }

      const apertaAt = mode === 'open' ? new Date().toISOString() : null;
      const lavorazione = await createLavorazione(
        supabase,
        {
          lineaId,
          siglaLottoId,
          dataIngresso,
          lottoIngresso: Number(lottoIngresso),
          articoloId,
          imballaggioSecondarioId,
          pesoPerCollo: Number(pesoPerCollo),
          note: note.trim() || null,
          apertaAt,
          apertaDa: apertaAt ? user.id : null
        },
        {
          userId: user.id,
          actorName: user.user_metadata?.full_name ?? user.email ?? 'Utente'
        }
      );

      onSuccess(lavorazione);
      onClose();
    } catch (error) {
      setFooterError(error instanceof Error ? error.message : 'Errore durante il salvataggio.');
    } finally {
      setSubmitMode(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
      <div className="h-full w-full overflow-y-auto bg-white md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-lg">
        <header className="border-b border-slate-200 px-4 py-4 md:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Nuova lavorazione</h2>
          <p className="text-sm text-slate-600">Configura i dati iniziali e scegli se avviare ora o programmare.</p>
        </header>

        <main className="space-y-5 px-4 py-4 md:px-6">
          {isLoadingData ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Caricamento dati…
            </div>
          ) : null}

          {resolvedFormData ? (
            <>
              <section className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Linea
                  <Select
                    value={lineaId}
                    onChange={(event) => {
                      setLineaId(event.target.value);
                      resetFieldError('lineaId');
                    }}
                  >
                    <option value="">Seleziona linea</option>
                    {resolvedFormData.linee.map((linea) => (
                      <option key={linea.id} value={linea.id}>
                        {linea.nome}
                      </option>
                    ))}
                  </Select>
                  {errors.lineaId ? <p className="mt-1 text-xs text-red-500">{errors.lineaId}</p> : null}
                </label>

                {lineWarning ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    ⚠ Questa linea ha già una lavorazione in corso. Puoi comunque procedere.
                  </div>
                ) : null}

                <label className="block text-sm font-medium text-slate-700">
                  Sigla lotto
                  <Select
                    value={siglaLottoId}
                    onChange={(event) => {
                      const nextSiglaLottoId = event.target.value;
                      setSiglaLottoId(nextSiglaLottoId);
                      resetFieldError('siglaLottoId');
                      setArticoloId('');
                    }}
                  >
                    <option value="">Seleziona sigla lotto</option>
                    {resolvedFormData.sigleLotto.map((sigla) => (
                      <option key={sigla.id} value={sigla.id}>
                        {sigla.codice} — {sigla.produttore}
                      </option>
                    ))}
                  </Select>
                  {errors.siglaLottoId ? <p className="mt-1 text-xs text-red-500">{errors.siglaLottoId}</p> : null}
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Prodotto grezzo</p>
                    <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {selectedSiglaLotto?.prodottoGrezzo.nome ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-700">Varietà</p>
                    <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedSiglaLotto?.varieta.nome ?? '—'}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Data ingresso
                    <Input
                      type="date"
                      value={dataIngresso}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        setDataIngresso(nextDate);
                        resetFieldError('dataIngresso');
                        const doy = dayOfYearFromDate(nextDate);
                        setLottoIngresso(doy ? String(doy) : '');
                        resetFieldError('lottoIngresso');
                      }}
                    />
                    {errors.dataIngresso ? <p className="mt-1 text-xs text-red-500">{errors.dataIngresso}</p> : null}
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Lotto ingresso (DOY)
                    <Input
                      inputMode="numeric"
                      value={lottoIngresso}
                      onChange={(event) => {
                        const clean = event.target.value.replace(/\D/g, '').slice(0, 3);
                        setLottoIngresso(clean);
                        resetFieldError('lottoIngresso');

                        if (!clean) {
                          setDataIngresso('');
                          return;
                        }

                        const currentYear = new Date().getFullYear();
                        const nextDate = dateFromDayOfYear(Number(clean), currentYear);
                        setDataIngresso(nextDate ?? '');
                        resetFieldError('dataIngresso');
                      }}
                    />
                    {errors.lottoIngresso ? <p className="mt-1 text-xs text-red-500">{errors.lottoIngresso}</p> : null}
                  </label>
                </div>
              </section>

              <hr className="border-slate-200" />

              <section className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Articolo
                  <Select
                    value={articoloId}
                    onChange={(event) => {
                      const nextArticoloId = event.target.value;
                      setArticoloId(nextArticoloId);
                      resetFieldError('articoloId');

                      const nextArticolo = resolvedFormData.articoli.find((item) => item.id === nextArticoloId);
                      if (nextArticolo) {
                        setPesoPerCollo(String(nextArticolo.pesoPerCollo));
                        resetFieldError('pesoPerCollo');
                      }
                    }}
                  >
                    <option value="">Seleziona articolo</option>
                    {filteredArticoli.map((articolo) => (
                      <option key={articolo.id} value={articolo.id}>
                        {articolo.nome} — {articolo.pesoPerCollo} kg/collo
                      </option>
                    ))}
                  </Select>
                  {errors.articoloId ? <p className="mt-1 text-xs text-red-500">{errors.articoloId}</p> : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Peso per collo (kg)
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={pesoPerCollo}
                      onChange={(event) => {
                        setPesoPerCollo(event.target.value);
                        resetFieldError('pesoPerCollo');
                      }}
                    />
                    {selectedArticolo && Number(pesoPerCollo) !== selectedArticolo.pesoPerCollo ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1 text-xs text-amber-700">
                        override <Edit3 className="h-3 w-3" />
                      </span>
                    ) : null}
                  </div>
                  {errors.pesoPerCollo ? (
                    <p className="mt-1 text-xs text-red-500">{errors.pesoPerCollo}</p>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Imballaggio secondario
                  <Select
                    value={imballaggioSecondarioId}
                    onChange={(event) => {
                      setImballaggioSecondarioId(event.target.value);
                      resetFieldError('imballaggioSecondarioId');
                    }}
                  >
                    <option value="">Seleziona imballaggio</option>
                    {resolvedFormData.imballaggi.map((imballaggio) => (
                      <option key={imballaggio.id} value={imballaggio.id}>
                        {imballaggio.nome}
                        {imballaggio.taraKg !== null ? ` — tara ${imballaggio.taraKg} kg` : ''}
                      </option>
                    ))}
                  </Select>
                  {errors.imballaggioSecondarioId ? (
                    <p className="mt-1 text-xs text-red-500">{errors.imballaggioSecondarioId}</p>
                  ) : null}
                </label>
              </section>

              <hr className="border-slate-200" />

              <section>
                <label className="block text-sm font-medium text-slate-700">
                  Note (opzionale)
                  <textarea
                    value={note}
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                    className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">{500 - note.length} caratteri rimanenti</p>
              </section>
            </>
          ) : null}
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 md:px-6">
          {footerError ? <p className="mb-2 text-sm text-red-600">{footerError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Annulla
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleSubmit('schedule')}
              type="button"
              disabled={isSaving || isLoadingData || !resolvedFormData}
            >
              {submitMode === 'schedule' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitMode === 'schedule' ? 'Salvataggio…' : 'Programma'}
            </Button>
            <Button
              onClick={() => void handleSubmit('open')}
              type="button"
              disabled={isSaving || isLoadingData || !resolvedFormData}
            >
              {submitMode === 'open' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitMode === 'open' ? 'Avvio…' : 'Avvia ora'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
