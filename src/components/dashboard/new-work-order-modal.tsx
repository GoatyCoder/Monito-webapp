'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getUserDisplayName } from '@/lib/auth/user';
import {
  createLavorazione,
  fetchNewWorkOrderFormData,
  type CreateLavorazionePayload,
  type WorkOrderFormData
} from '@/lib/db/queries/lavorazioni';
import { createSupabaseClient } from '@/lib/db/supabase-client';
import { dateFromDayOfYear, dayOfYearFromDate } from '@/lib/utils/date';
import type { Lavorazione } from '@/types/domain';

type NewWorkOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lavorazione: Lavorazione) => void;
  formData?: WorkOrderFormData | null;
};

type SubmitMode = 'schedule' | 'open';
type FieldErrors = Partial<Record<'lineaId' | 'siglaLottoId' | 'dataIngresso' | 'lottoIngresso' | 'articoloId' | 'pesoPerCollo' | 'imballaggioSecondarioId', string>>;

const DEFAULT_FORM = {
  lineaId: '',
  siglaLottoId: '',
  dataIngresso: '',
  lottoIngresso: '',
  articoloId: '',
  imballaggioSecondarioId: '',
  pesoPerCollo: '',
  note: ''
};

export function NewWorkOrderModal({ isOpen, onClose, onSuccess, formData }: NewWorkOrderModalProps) {
  const [localFormData, setLocalFormData] = useState<WorkOrderFormData | null>(formData ?? null);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [footerError, setFooterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>('schedule');

  useEffect(() => {
    setLocalFormData(formData ?? null);
  }, [formData]);

  useEffect(() => {
    if (!isOpen || formData) {
      return;
    }

    let isMounted = true;

    async function loadFormData() {
      setIsLoadingFormData(true);
      setFooterError(null);
      try {
        const supabase = createSupabaseClient();
        const data = await fetchNewWorkOrderFormData(supabase);
        if (isMounted) {
          setLocalFormData(data);
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : 'Errore durante il caricamento dei dati del modale.';
          setFooterError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingFormData(false);
        }
      }
    }

    loadFormData();

    return () => {
      isMounted = false;
    };
  }, [formData, isOpen]);

  const selectedSigla = useMemo(
    () => localFormData?.sigleLotto.find((sigla) => sigla.id === formValues.siglaLottoId) ?? null,
    [formValues.siglaLottoId, localFormData]
  );

  const filteredArticoli = useMemo(() => {
    if (!localFormData) {
      return [];
    }

    if (!selectedSigla) {
      return localFormData.articoli;
    }

    return localFormData.articoli.filter(
      (articolo) =>
        articolo.vincoloProdottoGrezzoId === null || articolo.vincoloProdottoGrezzoId === selectedSigla.prodottoGrezzoId
    );
  }, [localFormData, selectedSigla]);

  const selectedArticolo = useMemo(
    () => filteredArticoli.find((articolo) => articolo.id === formValues.articoloId) ?? null,
    [filteredArticoli, formValues.articoloId]
  );

  const hasPesoOverride =
    selectedArticolo !== null &&
    formValues.pesoPerCollo.trim().length > 0 &&
    Number(formValues.pesoPerCollo) !== selectedArticolo.pesoPerCollo;

  const isLineaBusy =
    Boolean(formValues.lineaId) &&
    Boolean(localFormData?.lavorazioniInCorso.some((lavorazione) => lavorazione.lineaId === formValues.lineaId));

  function handleClose() {
    setFormValues(DEFAULT_FORM);
    setErrors({});
    setFooterError(null);
    onClose();
  }

  function validateForm(): FieldErrors {
    const nextErrors: FieldErrors = {};
    const doyValue = Number(formValues.lottoIngresso);
    const pesoValue = Number(formValues.pesoPerCollo);

    if (!formValues.lineaId) nextErrors.lineaId = 'Seleziona una linea.';
    if (!formValues.siglaLottoId) nextErrors.siglaLottoId = 'Seleziona una sigla lotto.';
    if (!formValues.dataIngresso || dayOfYearFromDate(formValues.dataIngresso) === null) {
      nextErrors.dataIngresso = 'Inserisci una data ingresso valida.';
    }
    if (!formValues.lottoIngresso || !Number.isInteger(doyValue) || doyValue < 1 || doyValue > 366) {
      nextErrors.lottoIngresso = 'Inserisci un DOY valido tra 1 e 366.';
    }
    if (!formValues.articoloId) nextErrors.articoloId = 'Seleziona un articolo.';
    if (!formValues.pesoPerCollo || Number.isNaN(pesoValue) || pesoValue <= 0) {
      nextErrors.pesoPerCollo = 'Inserisci un peso per collo maggiore di 0.';
    }
    if (!formValues.imballaggioSecondarioId) nextErrors.imballaggioSecondarioId = 'Seleziona un imballaggio secondario.';

    return nextErrors;
  }

  function handleDateChange(value: string) {
    setFormValues((current) => ({
      ...current,
      dataIngresso: value,
      lottoIngresso: value ? String(dayOfYearFromDate(value) ?? '') : ''
    }));
  }

  function handleDoyChange(rawValue: string) {
    const sanitizedValue = rawValue.replace(/\D/g, '').slice(0, 3);
    const year = new Date().getFullYear();
    const doyValue = Number(sanitizedValue);

    setFormValues((current) => ({
      ...current,
      lottoIngresso: sanitizedValue,
      dataIngresso:
        sanitizedValue.length === 0 ? '' : dateFromDayOfYear(doyValue, year) ?? current.dataIngresso
    }));
  }

  async function handleSubmit(mode: SubmitMode) {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setFooterError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMode(mode);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Utente non autenticato.');
      }

      const payload: CreateLavorazionePayload = {
        lineaId: formValues.lineaId,
        siglaLottoId: formValues.siglaLottoId,
        dataIngresso: formValues.dataIngresso,
        lottoIngresso: Number(formValues.lottoIngresso),
        articoloId: formValues.articoloId,
        imballaggioSecondarioId: formValues.imballaggioSecondarioId,
        pesoPerCollo: Number(formValues.pesoPerCollo),
        note: formValues.note.trim() ? formValues.note.trim() : null,
        apertaAt: mode === 'open' ? new Date().toISOString() : null,
        apertaDa: mode === 'open' ? user.id : null
      };

      const lavorazione = await createLavorazione(supabase, payload, {
        userId: user.id,
        actorName: getUserDisplayName(user)
      });

      onSuccess(lavorazione);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il salvataggio della lavorazione.';
      setFooterError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 md:items-center md:p-4">
      <div className="h-full w-full overflow-y-auto bg-white p-4 md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-lg">
        <header className="mb-4">
          <h2 className="text-lg font-semibold">Nuova lavorazione</h2>
          <p className="text-sm text-slate-500">Compila i campi e scegli se programmare o avviare subito.</p>
        </header>

        {isLoadingFormData ? <p className="text-sm text-slate-500">Caricamento dati...</p> : null}

        {localFormData ? (
          <div className="space-y-4">
            <section className="space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Linea</span>
                <Select
                  value={formValues.lineaId}
                  onChange={(event) => setFormValues((current) => ({ ...current, lineaId: event.target.value }))}
                >
                  <option value="">Seleziona linea</option>
                  {localFormData.linee.map((linea) => (
                    <option key={linea.id} value={linea.id}>
                      {linea.nome}
                    </option>
                  ))}
                </Select>
                {errors.lineaId ? <span className="text-xs text-red-500">{errors.lineaId}</span> : null}
                {isLineaBusy ? (
                  <span className="text-xs text-amber-600">⚠ Questa linea ha già una lavorazione in corso. Puoi comunque procedere.</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>Sigla lotto</span>
                <Select
                  value={formValues.siglaLottoId}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      siglaLottoId: event.target.value,
                      articoloId: '',
                      pesoPerCollo: ''
                    }))
                  }
                >
                  <option value="">Seleziona sigla lotto</option>
                  {localFormData.sigleLotto.map((sigla) => (
                    <option key={sigla.id} value={sigla.id}>
                      {sigla.codice} — {sigla.produttore}
                    </option>
                  ))}
                </Select>
                {errors.siglaLottoId ? <span className="text-xs text-red-500">{errors.siglaLottoId}</span> : null}
              </label>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm">Prodotto grezzo</p>
                  <p className="rounded bg-slate-50 px-3 py-2 text-sm">{selectedSigla?.prodottoGrezzo.nome ?? '—'}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm">Varietà</p>
                  <p className="rounded bg-slate-50 px-3 py-2 text-sm">{selectedSigla?.varieta.nome ?? '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Data ingresso</span>
                  <Input type="date" value={formValues.dataIngresso} onChange={(event) => handleDateChange(event.target.value)} />
                  {errors.dataIngresso ? <span className="text-xs text-red-500">{errors.dataIngresso}</span> : null}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Lotto ingresso (DOY)</span>
                  <Input
                    inputMode="numeric"
                    min={1}
                    max={366}
                    value={formValues.lottoIngresso}
                    onChange={(event) => handleDoyChange(event.target.value)}
                  />
                  {errors.lottoIngresso ? <span className="text-xs text-red-500">{errors.lottoIngresso}</span> : null}
                </label>
              </div>
            </section>

            <hr />

            <section className="space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Articolo</span>
                <Select
                  value={formValues.articoloId}
                  onChange={(event) => {
                    const articoloId = event.target.value;
                    const articolo = filteredArticoli.find((entry) => entry.id === articoloId) ?? null;
                    setFormValues((current) => ({
                      ...current,
                      articoloId,
                      pesoPerCollo: articolo ? articolo.pesoPerCollo.toFixed(3) : ''
                    }));
                  }}
                >
                  <option value="">Seleziona articolo</option>
                  {filteredArticoli.map((articolo) => (
                    <option key={articolo.id} value={articolo.id}>
                      {articolo.nome} — {articolo.pesoPerCollo} kg/collo
                    </option>
                  ))}
                </Select>
                {errors.articoloId ? <span className="text-xs text-red-500">{errors.articoloId}</span> : null}
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>Peso per collo (kg)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formValues.pesoPerCollo}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, pesoPerCollo: event.target.value }))
                    }
                  />
                  {hasPesoOverride ? (
                    <Badge variant="accent" className="gap-1">
                      <Edit3 className="h-3.5 w-3.5" />
                      override
                    </Badge>
                  ) : null}
                </div>
                {errors.pesoPerCollo ? (
                  <span className="text-xs text-red-500">{errors.pesoPerCollo}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span>Imballaggio secondario</span>
                <Select
                  value={formValues.imballaggioSecondarioId}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, imballaggioSecondarioId: event.target.value }))
                  }
                >
                  <option value="">Seleziona imballaggio</option>
                  {localFormData.imballaggi.map((imballaggio) => (
                    <option key={imballaggio.id} value={imballaggio.id}>
                      {imballaggio.nome}
                      {imballaggio.taraKg !== null ? ` — tara ${imballaggio.taraKg} kg` : ''}
                    </option>
                  ))}
                </Select>
                {errors.imballaggioSecondarioId ? (
                  <span className="text-xs text-red-500">{errors.imballaggioSecondarioId}</span>
                ) : null}
              </label>
            </section>

            <hr />

            <section className="space-y-2">
              <label className="flex flex-col gap-1 text-sm">
                <span>Note</span>
                <textarea
                  className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
                  maxLength={500}
                  value={formValues.note}
                  onChange={(event) => setFormValues((current) => ({ ...current, note: event.target.value }))}
                />
              </label>
              <p className="text-xs text-slate-500">{500 - formValues.note.length} caratteri rimanenti</p>
            </section>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-200 pt-4">
          {footerError ? <p className="mb-2 text-xs text-red-500">{footerError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button
              variant="secondary"
              disabled={isSubmitting || isLoadingFormData || !localFormData}
              onClick={() => handleSubmit('schedule')}
            >
              {isSubmitting && submitMode === 'schedule' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvataggio…
                </>
              ) : (
                'Programma'
              )}
            </Button>
            <Button disabled={isSubmitting || isLoadingFormData || !localFormData} onClick={() => handleSubmit('open')}>
              {isSubmitting && submitMode === 'open' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Avvio…
                </>
              ) : (
                'Avvia ora'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
