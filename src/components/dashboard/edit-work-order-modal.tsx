'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchNewWorkOrderFormData, updateLavorazione, type DashboardLavorazioneItem } from '@/lib/db/queries/lavorazioni';
import { createSupabaseClient } from '@/lib/db/supabase-client';
import { dateFromDayOfYear, dayOfYearFromDate } from '@/lib/utils/date';

type EditWorkOrderModalProps = {
  lavorazione: DashboardLavorazioneItem | null;
  onClose: () => void;
  onUpdated: () => void;
};

export function EditWorkOrderModal({ lavorazione, onClose, onUpdated }: EditWorkOrderModalProps) {
  const [supabase] = useState(() => createSupabaseClient());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [footerError, setFooterError] = useState('');
  const [siglaLottoId, setSiglaLottoId] = useState('');
  const [dataIngresso, setDataIngresso] = useState('');
  const [lottoIngresso, setLottoIngresso] = useState('');
  const [articoloId, setArticoloId] = useState('');
  const [imballaggioSecondarioId, setImballaggioSecondarioId] = useState('');
  const [pesoPerCollo, setPesoPerCollo] = useState('');
  const [note, setNote] = useState('');
  const [formData, setFormData] = useState<Awaited<ReturnType<typeof fetchNewWorkOrderFormData>> | null>(null);

  useEffect(() => {
    if (!lavorazione) {
      return;
    }

    setSiglaLottoId(lavorazione.siglaLottoId);
    setDataIngresso(lavorazione.dataIngresso);
    setLottoIngresso(String(lavorazione.lottoIngresso).padStart(3, '0'));
    setArticoloId(lavorazione.articoloId);
    setImballaggioSecondarioId(lavorazione.imballaggioSecondarioId);
    setPesoPerCollo(String(lavorazione.pesoPerCollo));
    setNote(lavorazione.note ?? '');
    setFooterError('');

    let isCancelled = false;
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchNewWorkOrderFormData(supabase);
        if (!isCancelled) {
          setFormData(data);
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

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [lavorazione, supabase]);

  const selectedSigla = useMemo(() => formData?.sigleLotto.find((item) => item.id === siglaLottoId) ?? null, [formData, siglaLottoId]);

  const filteredArticoli = useMemo(() => {
    if (!formData) {
      return [];
    }

    if (!selectedSigla) {
      return formData.articoli;
    }

    return formData.articoli.filter(
      (articolo) => articolo.vincoloProdottoGrezzoId === selectedSigla.prodottoGrezzoId || articolo.vincoloProdottoGrezzoId === null
    );
  }, [formData, selectedSigla]);

  if (!lavorazione) {
    return null;
  }

  const handleSave = async () => {
    if (!formData) {
      return;
    }

    setFooterError('');
    setIsSaving(true);
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Sessione non disponibile. Esegui nuovamente il login.');
      }

      const parsedDoy = Number(lottoIngresso);
      const parsedPeso = Number(pesoPerCollo);
      if (!Number.isInteger(parsedDoy) || parsedDoy < 1 || parsedDoy > 366) {
        throw new Error('Inserisci un DOY valido tra 1 e 366.');
      }

      if (!siglaLottoId || !articoloId || !imballaggioSecondarioId || !dataIngresso || Number.isNaN(parsedPeso) || parsedPeso <= 0) {
        throw new Error('Compila tutti i campi obbligatori prima di salvare.');
      }

      await updateLavorazione(
        supabase,
        {
          lavorazioneId: lavorazione.id,
          siglaLottoId,
          dataIngresso,
          lottoIngresso: parsedDoy,
          articoloId,
          imballaggioSecondarioId,
          pesoPerCollo: parsedPeso,
          note: note.trim() || null,
        },
        { userId: user.id, actorName: user.user_metadata?.full_name ?? user.email ?? 'Utente' }
      );

      onUpdated();
      onClose();
    } catch (error) {
      setFooterError(error instanceof Error ? error.message : 'Errore durante il salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 md:items-center md:p-4">
      <div className="h-full w-full overflow-y-auto bg-white md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-lg">
        <header className="border-b border-slate-200 px-4 py-4 md:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Modifica lavorazione</h2>
        </header>

        <main className="space-y-4 px-4 py-4 md:px-6">
          {isLoadingData ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Caricamento dati…
            </div>
          ) : null}

          {formData ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Sigla lotto
                <Select value={siglaLottoId} onChange={(event) => setSiglaLottoId(event.target.value)}>
                  <option value="">Seleziona sigla lotto</option>
                  {formData.sigleLotto.map((sigla) => (
                    <option key={sigla.id} value={sigla.id}>
                      {sigla.codice}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Data ingresso
                  <Input
                    type="date"
                    value={dataIngresso}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      setDataIngresso(nextDate);
                      const doy = dayOfYearFromDate(nextDate);
                      setLottoIngresso(doy ? String(doy).padStart(3, '0') : '');
                    }}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Lotto ingresso (DOY)
                  <Input
                    value={lottoIngresso}
                    onChange={(event) => {
                      const clean = event.target.value.replace(/\D/g, '').slice(0, 3);
                      setLottoIngresso(clean);
                      if (!clean) {
                        setDataIngresso('');
                        return;
                      }

                      const currentYear = new Date().getFullYear();
                      const nextDate = dateFromDayOfYear(Number(clean), currentYear);
                      setDataIngresso(nextDate ?? '');
                    }}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Articolo
                <Select value={articoloId} onChange={(event) => setArticoloId(event.target.value)}>
                  <option value="">Seleziona articolo</option>
                  {filteredArticoli.map((articolo) => (
                    <option key={articolo.id} value={articolo.id}>
                      {articolo.nome}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Imballaggio secondario
                <Select value={imballaggioSecondarioId} onChange={(event) => setImballaggioSecondarioId(event.target.value)}>
                  <option value="">Seleziona imballaggio</option>
                  {formData.imballaggi.map((imballaggio) => (
                    <option key={imballaggio.id} value={imballaggio.id}>
                      {imballaggio.nome}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Peso per collo (kg)
                <Input type="number" min="0.001" step="0.001" value={pesoPerCollo} onChange={(event) => setPesoPerCollo(event.target.value)} />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Note (opzionale)
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>

            </>
          ) : null}
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 md:px-6">
          {footerError ? <p className="mb-2 text-sm text-red-600">{footerError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} type="button">
              Annulla
            </Button>
            <Button onClick={() => void handleSave()} type="button" disabled={isSaving || isLoadingData || !formData}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Salvataggio…' : 'Salva modifiche'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
