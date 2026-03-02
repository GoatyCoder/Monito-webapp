'use client';

import { FormEvent, useMemo, useState } from 'react';

import type {
  Articolo as DomainArticolo,
  ImballaggioSecondario as DomainImballaggioSecondario,
  Linea as DomainLinea,
  ProdottoGrezzo as DomainProdottoGrezzo,
  SiglaLotto as DomainSiglaLotto,
  Varieta as DomainVarieta
} from '@/types/domain';

type EntityKey = 'linee' | 'prodottiGrezzi' | 'varieta' | 'imballaggiSecondari' | 'articoli' | 'sigleLotto';

type Linea = Omit<Pick<DomainLinea, 'id' | 'nome' | 'descrizione' | 'ordine'>, 'descrizione'> & { descrizione: string };
type ProdottoGrezzo = Omit<Pick<DomainProdottoGrezzo, 'id' | 'nome' | 'descrizione'>, 'descrizione'> & { descrizione: string };
type Varieta = Omit<Pick<DomainVarieta, 'id' | 'nome' | 'descrizione' | 'prodottoGrezzoId'>, 'descrizione'> & { descrizione: string };
type ImballaggioSecondario = Omit<
  Pick<DomainImballaggioSecondario, 'id' | 'nome' | 'descrizione' | 'taraKg' | 'lunghezzaCm' | 'larghezzaCm' | 'altezzaCm'>,
  'descrizione'
> & { descrizione: string };
type Articolo = Omit<
  Pick<DomainArticolo, 'id' | 'nome' | 'descrizione' | 'pesoPerCollo' | 'pesoVariabile' | 'vincoloProdottoGrezzoId' | 'vincoloVarietaId'>,
  'descrizione'
> & { descrizione: string };
type SiglaLotto = Omit<
  Pick<DomainSiglaLotto, 'id' | 'codice' | 'produttore' | 'prodottoGrezzoId' | 'varietaId' | 'campo'>,
  'campo'
> & { campo: string };

type SortDirection = 'none' | 'asc' | 'desc';

type RowAdapter = {
  id: string;
  searchText: string;
  renderCell: (key: string, refs: { prodottiGrezzi: ProdottoGrezzo[]; varieta: Varieta[] }) => string;
  sortValue: (key: string) => string | number;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const ENTITY_MENU: { key: EntityKey; label: string; description: string; ctaLabel: string }[] = [
  { key: 'linee', label: 'Linee', description: 'Gestione linee di produzione e ordine sul cruscotto.', ctaLabel: 'Nuova linea' },
  { key: 'prodottiGrezzi', label: 'Prodotti grezzi', description: 'Anagrafica prodotto origine.', ctaLabel: 'Nuovo prodotto grezzo' },
  { key: 'varieta', label: 'Varietà', description: 'Varietà collegate al prodotto grezzo.', ctaLabel: 'Nuova varietà' },
  { key: 'imballaggiSecondari', label: 'Imballaggi secondari', description: 'Imballaggi con tara e dimensioni.', ctaLabel: 'Nuovo imballaggio secondario' },
  { key: 'articoli', label: 'Articoli', description: 'Articoli con regole peso e vincoli lotto.', ctaLabel: 'Nuovo articolo' },
  { key: 'sigleLotto', label: 'Sigle lotto', description: 'Sigle valide per apertura lavorazioni.', ctaLabel: 'Nuova sigla lotto' }
];

export function RegistryManager() {
  const [linee, setLinee] = useState<Linea[]>([
    { id: uid(), nome: 'Linea 01', descrizione: 'Confezionamento premium', ordine: 1 },
    { id: uid(), nome: 'Linea 02', descrizione: 'Calibratura automatica', ordine: 2 }
  ]);
  const [prodottiGrezzi, setProdottiGrezzi] = useState<ProdottoGrezzo[]>([
    { id: uid(), nome: 'Uva da tavola', descrizione: 'Conferimenti locali' },
    { id: uid(), nome: 'Mandarino', descrizione: 'Campagna invernale' }
  ]);
  const [varieta, setVarieta] = useState<Varieta[]>([]);
  const [imballaggiSecondari, setImballaggiSecondari] = useState<ImballaggioSecondario[]>([
    { id: uid(), nome: 'Cartone 40x60', descrizione: 'Standard export', taraKg: 0.8, lunghezzaCm: 60, larghezzaCm: 40, altezzaCm: 20 }
  ]);
  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [sigleLotto, setSigleLotto] = useState<SiglaLotto[]>([]);

  const [selectedEntity, setSelectedEntity] = useState<EntityKey>('linee');
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ key: string; direction: SortDirection }>({ key: 'nome', direction: 'none' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lineeError, setLineeError] = useState('');

  const [lineaForm, setLineaForm] = useState({ nome: '', descrizione: '', ordine: '' });
  const [prodottoForm, setProdottoForm] = useState({ nome: '', descrizione: '' });
  const [varietaForm, setVarietaForm] = useState({ nome: '', descrizione: '', prodottoGrezzoId: '' });
  const [imballaggioForm, setImballaggioForm] = useState({ nome: '', descrizione: '', taraKg: '', lunghezzaCm: '', larghezzaCm: '', altezzaCm: '' });
  const [articoloForm, setArticoloForm] = useState({
    nome: '',
    descrizione: '',
    pesoPerCollo: '',
    pesoVariabile: false,
    vincoloProdottoGrezzoId: '',
    vincoloVarietaId: ''
  });
  const [siglaForm, setSiglaForm] = useState({ codice: '', produttore: '', prodottoGrezzoId: '', varietaId: '', campo: '' });

  const varietaPerArticolo = useMemo(() => {
    if (!articoloForm.vincoloProdottoGrezzoId) {
      return varieta;
    }

    return varieta.filter((item) => item.prodottoGrezzoId === articoloForm.vincoloProdottoGrezzoId);
  }, [articoloForm.vincoloProdottoGrezzoId, varieta]);

  const varietaPerSigla = useMemo(() => {
    if (!siglaForm.prodottoGrezzoId) {
      return [];
    }

    return varieta.filter((item) => item.prodottoGrezzoId === siglaForm.prodottoGrezzoId);
  }, [siglaForm.prodottoGrezzoId, varieta]);

  const columns = getColumns(selectedEntity);

  const dataRows = useMemo(() => {
    const rows = getEntityRows(selectedEntity, { linee, prodottiGrezzi, varieta, imballaggiSecondari, articoli, sigleLotto });

    const filtered = rows.filter((row) => {
      const normalizedSearch = search.trim().toLocaleLowerCase('it');
      return normalizedSearch.length === 0 || row.searchText.toLocaleLowerCase('it').includes(normalizedSearch);
    });

    if (sortState.direction === 'none') {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const first = String(a.sortValue(sortState.key));
      const second = String(b.sortValue(sortState.key));
      return first.localeCompare(second, 'it') * (sortState.direction === 'asc' ? 1 : -1);
    });
  }, [selectedEntity, linee, prodottiGrezzi, varieta, imballaggiSecondari, articoli, sigleLotto, search, sortState]);

  const totalPages = Math.max(1, Math.ceil(dataRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = dataRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetUi(nextEntity?: EntityKey) {
    if (nextEntity) setSelectedEntity(nextEntity);
    setSearch('');
    setSortState({ key: 'nome', direction: 'none' });
    setCurrentPage(1);
    setEditingId(null);
    setLineeError('');
  }

  function handleSort(key: string) {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key, direction: 'none' };
      return { key, direction: 'asc' };
    });
  }

  function onDelete(id: string) {
    if (selectedEntity === 'linee') setLinee((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntity === 'prodottiGrezzi') setProdottiGrezzi((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntity === 'varieta') setVarieta((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntity === 'imballaggiSecondari') setImballaggiSecondari((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntity === 'articoli') setArticoli((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntity === 'sigleLotto') setSigleLotto((prev) => prev.filter((item) => item.id !== id));
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedEntity === 'linee') {
      if (!lineaForm.nome.trim()) return;
      const ordine = lineaForm.ordine ? Number(lineaForm.ordine) : null;
      const alreadyExists = ordine !== null && linee.some((item) => item.ordine === ordine && item.id !== editingId);

      if (alreadyExists) {
        setLineeError(`Ordine ${ordine} già assegnato a un'altra linea.`);
        return;
      }

      if (editingId) {
        setLinee((prev) => prev.map((item) => (item.id === editingId ? { ...item, nome: lineaForm.nome.trim(), descrizione: lineaForm.descrizione.trim(), ordine } : item)));
      } else {
        setLinee((prev) => [{ id: uid(), nome: lineaForm.nome.trim(), descrizione: lineaForm.descrizione.trim(), ordine }, ...prev]);
      }

      setLineeError('');
      setLineaForm({ nome: '', descrizione: '', ordine: '' });
    }

    if (selectedEntity === 'prodottiGrezzi') {
      if (!prodottoForm.nome.trim()) return;
      if (editingId) {
        setProdottiGrezzi((prev) => prev.map((item) => (item.id === editingId ? { ...item, nome: prodottoForm.nome.trim(), descrizione: prodottoForm.descrizione.trim() } : item)));
      } else {
        setProdottiGrezzi((prev) => [{ id: uid(), nome: prodottoForm.nome.trim(), descrizione: prodottoForm.descrizione.trim() }, ...prev]);
      }
      setProdottoForm({ nome: '', descrizione: '' });
    }

    if (selectedEntity === 'varieta') {
      if (!varietaForm.nome.trim() || !varietaForm.prodottoGrezzoId) return;
      if (editingId) {
        setVarieta((prev) => prev.map((item) => (item.id === editingId ? { ...item, nome: varietaForm.nome.trim(), descrizione: varietaForm.descrizione.trim(), prodottoGrezzoId: varietaForm.prodottoGrezzoId } : item)));
      } else {
        setVarieta((prev) => [{ id: uid(), nome: varietaForm.nome.trim(), descrizione: varietaForm.descrizione.trim(), prodottoGrezzoId: varietaForm.prodottoGrezzoId }, ...prev]);
      }
      setVarietaForm({ nome: '', descrizione: '', prodottoGrezzoId: '' });
    }

    if (selectedEntity === 'imballaggiSecondari') {
      if (!imballaggioForm.nome.trim()) return;
      const payload: Omit<ImballaggioSecondario, 'id'> = {
        nome: imballaggioForm.nome.trim(),
        descrizione: imballaggioForm.descrizione.trim(),
        taraKg: toNumberOrNull(imballaggioForm.taraKg),
        lunghezzaCm: toNumberOrNull(imballaggioForm.lunghezzaCm),
        larghezzaCm: toNumberOrNull(imballaggioForm.larghezzaCm),
        altezzaCm: toNumberOrNull(imballaggioForm.altezzaCm)
      };

      if (editingId) {
        setImballaggiSecondari((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      } else {
        setImballaggiSecondari((prev) => [{ id: uid(), ...payload }, ...prev]);
      }
      setImballaggioForm({ nome: '', descrizione: '', taraKg: '', lunghezzaCm: '', larghezzaCm: '', altezzaCm: '' });
    }

    if (selectedEntity === 'articoli') {
      if (!articoloForm.nome.trim() || !articoloForm.pesoPerCollo) return;
      if (articoloForm.vincoloVarietaId && !articoloForm.vincoloProdottoGrezzoId) return;

      const payload: Omit<Articolo, 'id'> = {
        nome: articoloForm.nome.trim(),
        descrizione: articoloForm.descrizione.trim(),
        pesoPerCollo: Number(articoloForm.pesoPerCollo),
        pesoVariabile: articoloForm.pesoVariabile,
        vincoloProdottoGrezzoId: articoloForm.vincoloProdottoGrezzoId || null,
        vincoloVarietaId: articoloForm.vincoloVarietaId || null
      };

      if (editingId) {
        setArticoli((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      } else {
        setArticoli((prev) => [{ id: uid(), ...payload }, ...prev]);
      }

      setArticoloForm({ nome: '', descrizione: '', pesoPerCollo: '', pesoVariabile: false, vincoloProdottoGrezzoId: '', vincoloVarietaId: '' });
    }

    if (selectedEntity === 'sigleLotto') {
      if (!siglaForm.codice.trim() || !siglaForm.produttore.trim() || !siglaForm.prodottoGrezzoId || !siglaForm.varietaId) return;
      const payload: Omit<SiglaLotto, 'id'> = {
        codice: siglaForm.codice.trim(),
        produttore: siglaForm.produttore.trim(),
        prodottoGrezzoId: siglaForm.prodottoGrezzoId,
        varietaId: siglaForm.varietaId,
        campo: siglaForm.campo.trim()
      };

      if (editingId) {
        setSigleLotto((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      } else {
        setSigleLotto((prev) => [{ id: uid(), ...payload }, ...prev]);
      }

      setSiglaForm({ codice: '', produttore: '', prodottoGrezzoId: '', varietaId: '', campo: '' });
    }

    setEditingId(null);
    setCurrentPage(1);
  }

  function onEdit(id: string) {
    setEditingId(id);

    if (selectedEntity === 'linee') {
      const row = linee.find((item) => item.id === id);
      if (!row) return;
      setLineaForm({ nome: row.nome, descrizione: row.descrizione, ordine: row.ordine ? String(row.ordine) : '' });
    }

    if (selectedEntity === 'prodottiGrezzi') {
      const row = prodottiGrezzi.find((item) => item.id === id);
      if (!row) return;
      setProdottoForm({ nome: row.nome, descrizione: row.descrizione });
    }

    if (selectedEntity === 'varieta') {
      const row = varieta.find((item) => item.id === id);
      if (!row) return;
      setVarietaForm({ nome: row.nome, descrizione: row.descrizione, prodottoGrezzoId: row.prodottoGrezzoId });
    }

    if (selectedEntity === 'imballaggiSecondari') {
      const row = imballaggiSecondari.find((item) => item.id === id);
      if (!row) return;
      setImballaggioForm({
        nome: row.nome,
        descrizione: row.descrizione,
        taraKg: row.taraKg ? String(row.taraKg) : '',
        lunghezzaCm: row.lunghezzaCm ? String(row.lunghezzaCm) : '',
        larghezzaCm: row.larghezzaCm ? String(row.larghezzaCm) : '',
        altezzaCm: row.altezzaCm ? String(row.altezzaCm) : ''
      });
    }

    if (selectedEntity === 'articoli') {
      const row = articoli.find((item) => item.id === id);
      if (!row) return;
      setArticoloForm({
        nome: row.nome,
        descrizione: row.descrizione,
        pesoPerCollo: String(row.pesoPerCollo),
        pesoVariabile: row.pesoVariabile,
        vincoloProdottoGrezzoId: row.vincoloProdottoGrezzoId ?? '',
        vincoloVarietaId: row.vincoloVarietaId ?? ''
      });
    }

    if (selectedEntity === 'sigleLotto') {
      const row = sigleLotto.find((item) => item.id === id);
      if (!row) return;
      setSiglaForm({ codice: row.codice, produttore: row.produttore, prodottoGrezzoId: row.prodottoGrezzoId, varietaId: row.varietaId, campo: row.campo });
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-primary">Gestione Anagrafiche</h1>
        <div className="space-y-2">
          {ENTITY_MENU.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => resetUi(item.key)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                selectedEntity === item.key ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-secondary hover:border-primary hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">{ENTITY_MENU.find((x) => x.key === selectedEntity)?.label}</h2>
          <p className="mt-1 text-sm text-secondary">{ENTITY_MENU.find((x) => x.key === selectedEntity)?.description}</p>
        </header>

        <form onSubmit={submitForm} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-primary">{editingId ? 'Modifica elemento selezionato' : ENTITY_MENU.find((x) => x.key === selectedEntity)?.ctaLabel}</p>
          {selectedEntity === 'linee' ? renderLineaForm(lineaForm, setLineaForm) : null}
          {selectedEntity === 'prodottiGrezzi' ? renderProdottoForm(prodottoForm, setProdottoForm) : null}
          {selectedEntity === 'varieta' ? renderVarietaForm(varietaForm, setVarietaForm, prodottiGrezzi) : null}
          {selectedEntity === 'imballaggiSecondari' ? renderImballaggioForm(imballaggioForm, setImballaggioForm) : null}
          {selectedEntity === 'articoli' ? renderArticoloForm(articoloForm, setArticoloForm, prodottiGrezzi, varietaPerArticolo) : null}
          {selectedEntity === 'sigleLotto' ? renderSiglaForm(siglaForm, setSiglaForm, prodottiGrezzi, varietaPerSigla) : null}

          {lineeError ? <p className="mt-2 text-sm text-error">{lineeError}</p> : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {editingId ? 'Salva modifiche' : 'Salva'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  resetForms(setLineaForm, setProdottoForm, setVarietaForm, setImballaggioForm, setArticoloForm, setSiglaForm);
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-secondary hover:border-primary hover:text-primary"
              >
                Annulla modifica
              </button>
            ) : null}
          </div>
        </form>

        <section className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Ricerca rapida..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-secondary">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      <button type="button" onClick={() => handleSort(column.key)} className="inline-flex items-center gap-2 text-left hover:text-primary">
                        {column.label} {sortState.key === column.key ? sortIcon(sortState.direction) : '↕'}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-secondary">Nessun risultato.</td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      {columns.map((column) => (
                        <td key={`${row.id}-${column.key}`} className="px-4 py-3">{row.renderCell(column.key, { prodottiGrezzi, varieta })}</td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => onEdit(row.id)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary hover:border-primary hover:text-primary">Modifica</button>
                          <button type="button" onClick={() => onDelete(row.id)} className="rounded-md border border-red-200 px-2 py-1 text-xs text-error hover:bg-red-50">Elimina</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-secondary">
            <div>Risultati: <strong>{dataRows.length}</strong> · Pagina <strong>{safePage}</strong> di <strong>{totalPages}</strong></div>
            <div className="flex items-center gap-2">
              <label htmlFor="page-size">Righe:</label>
              <select id="page-size" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }} className="rounded-md border border-slate-300 px-2 py-1">
                {PAGE_SIZE_OPTIONS.map((size) => (<option key={size} value={size}>{size}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <PagerButton label="«" onClick={() => setCurrentPage(1)} disabled={safePage === 1} />
              <PagerButton label="‹" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1} />
              {buildVisiblePages(safePage, totalPages).map((page) => (
                <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`rounded-md border px-2 py-1 ${page === safePage ? 'border-primary bg-blue-50 text-primary' : 'border-slate-300'}`}>{page}</button>
              ))}
              <PagerButton label="›" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safePage === totalPages} />
              <PagerButton label="»" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} />
            </div>
          </footer>
        </section>
      </div>
    </section>
  );
}

function getEntityRows(
  entity: EntityKey,
  data: { linee: Linea[]; prodottiGrezzi: ProdottoGrezzo[]; varieta: Varieta[]; imballaggiSecondari: ImballaggioSecondario[]; articoli: Articolo[]; sigleLotto: SiglaLotto[] }
): RowAdapter[] {
  if (entity === 'linee') {
    return data.linee.map((item) => ({
      id: item.id,
      searchText: `${item.nome} ${item.descrizione} ${item.ordine ?? ''}`,
      sortValue: (key) => (key === 'ordine' ? item.ordine ?? 0 : key === 'descrizione' ? item.descrizione : item.nome),
      renderCell: (key) => {
        if (key === 'nome') return item.nome;
        if (key === 'ordine') return item.ordine ? String(item.ordine) : '—';
        if (key === 'descrizione') return item.descrizione || '—';
        return '—';
      }
    }));
  }

  if (entity === 'prodottiGrezzi') {
    return data.prodottiGrezzi.map((item) => ({
      id: item.id,
      searchText: `${item.nome} ${item.descrizione}`,
      sortValue: (key) => (key === 'descrizione' ? item.descrizione : item.nome),
      renderCell: (key) => (key === 'nome' ? item.nome : key === 'descrizione' ? item.descrizione || '—' : '—')
    }));
  }

  if (entity === 'varieta') {
    return data.varieta.map((item) => ({
      id: item.id,
      searchText: `${item.nome} ${item.descrizione}`,
      sortValue: (key) => {
        if (key === 'nome') return item.nome;
        if (key === 'descrizione') return item.descrizione;
        return data.prodottiGrezzi.find((x) => x.id === item.prodottoGrezzoId)?.nome ?? '';
      },
      renderCell: (key, refs) => {
        if (key === 'nome') return item.nome;
        if (key === 'prodottoGrezzoId') return refs.prodottiGrezzi.find((x) => x.id === item.prodottoGrezzoId)?.nome ?? '—';
        if (key === 'descrizione') return item.descrizione || '—';
        return '—';
      }
    }));
  }

  if (entity === 'imballaggiSecondari') {
    return data.imballaggiSecondari.map((item) => ({
      id: item.id,
      searchText: `${item.nome} ${item.descrizione}`,
      sortValue: (key) => {
        if (key === 'nome') return item.nome;
        if (key === 'taraKg') return item.taraKg ?? 0;
        if (key === 'dimensioni') return `${item.lunghezzaCm ?? 0}-${item.larghezzaCm ?? 0}-${item.altezzaCm ?? 0}`;
        return item.descrizione;
      },
      renderCell: (key) => {
        if (key === 'nome') return item.nome;
        if (key === 'taraKg') return item.taraKg ? `${item.taraKg} kg` : '—';
        if (key === 'dimensioni') {
          if (!item.lunghezzaCm || !item.larghezzaCm || !item.altezzaCm) return '—';
          return `${item.lunghezzaCm}x${item.larghezzaCm}x${item.altezzaCm} cm`;
        }
        if (key === 'descrizione') return item.descrizione || '—';
        return '—';
      }
    }));
  }

  if (entity === 'articoli') {
    return data.articoli.map((item) => ({
      id: item.id,
      searchText: `${item.nome} ${item.descrizione}`,
      sortValue: (key) => {
        if (key === 'nome') return item.nome;
        if (key === 'pesoPerCollo') return item.pesoPerCollo;
        if (key === 'pesoVariabile') return item.pesoVariabile ? 1 : 0;
        return `${item.vincoloProdottoGrezzoId ?? ''}-${item.vincoloVarietaId ?? ''}`;
      },
      renderCell: (key, refs) => {
        if (key === 'nome') return item.nome;
        if (key === 'pesoPerCollo') return `${item.pesoPerCollo} kg`;
        if (key === 'pesoVariabile') return item.pesoVariabile ? 'Sì' : 'No';
        if (key === 'vincoli') {
          if (!item.vincoloProdottoGrezzoId && !item.vincoloVarietaId) return 'Nessuno';
          const prodotto = refs.prodottiGrezzi.find((x) => x.id === item.vincoloProdottoGrezzoId)?.nome;
          const varieta = refs.varieta.find((x) => x.id === item.vincoloVarietaId)?.nome;
          return [prodotto, varieta].filter(Boolean).join(' · ');
        }
        return '—';
      }
    }));
  }

  return data.sigleLotto.map((item) => ({
    id: item.id,
    searchText: `${item.codice} ${item.produttore} ${item.campo}`,
    sortValue: (key) => {
      if (key === 'codice') return item.codice;
      if (key === 'produttore') return item.produttore;
      if (key === 'campo') return item.campo;
      if (key === 'prodottoGrezzoId') return data.prodottiGrezzi.find((x) => x.id === item.prodottoGrezzoId)?.nome ?? '';
      return data.varieta.find((x) => x.id === item.varietaId)?.nome ?? '';
    },
    renderCell: (key, refs) => {
      if (key === 'codice') return item.codice;
      if (key === 'produttore') return item.produttore;
      if (key === 'prodottoGrezzoId') return refs.prodottiGrezzi.find((x) => x.id === item.prodottoGrezzoId)?.nome ?? '—';
      if (key === 'varietaId') return refs.varieta.find((x) => x.id === item.varietaId)?.nome ?? '—';
      if (key === 'campo') return item.campo || '—';
      return '—';
    }
  }));
}

function getColumns(entity: EntityKey): { key: string; label: string }[] {
  if (entity === 'linee') return [{ key: 'nome', label: 'Nome' }, { key: 'ordine', label: 'Ordine' }, { key: 'descrizione', label: 'Descrizione' }];
  if (entity === 'prodottiGrezzi') return [{ key: 'nome', label: 'Nome' }, { key: 'descrizione', label: 'Descrizione' }];
  if (entity === 'varieta') return [{ key: 'nome', label: 'Varietà' }, { key: 'prodottoGrezzoId', label: 'Prodotto grezzo' }, { key: 'descrizione', label: 'Descrizione' }];
  if (entity === 'imballaggiSecondari') return [{ key: 'nome', label: 'Nome' }, { key: 'taraKg', label: 'Tara' }, { key: 'dimensioni', label: 'Dimensioni' }, { key: 'descrizione', label: 'Descrizione' }];
  if (entity === 'articoli') return [{ key: 'nome', label: 'Nome' }, { key: 'pesoPerCollo', label: 'Peso/collo' }, { key: 'pesoVariabile', label: 'Peso variabile' }, { key: 'vincoli', label: 'Vincoli' }];
  return [{ key: 'codice', label: 'Sigla' }, { key: 'produttore', label: 'Produttore' }, { key: 'prodottoGrezzoId', label: 'Prodotto grezzo' }, { key: 'varietaId', label: 'Varietà' }, { key: 'campo', label: 'Campo' }];
}

function renderLineaForm(
  form: { nome: string; descrizione: string; ordine: string },
  setForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; ordine: string }>>
) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome linea *" required className={inputClass} />
      <input value={form.ordine} onChange={(e) => setForm((p) => ({ ...p, ordine: e.target.value }))} placeholder="Ordine dashboard" type="number" className={inputClass} />
      <input value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione" className={inputClass} />
    </div>
  );
}

function renderProdottoForm(
  form: { nome: string; descrizione: string },
  setForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string }>>
) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome prodotto grezzo *" required className={inputClass} />
      <input value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione" className={inputClass} />
    </div>
  );
}

function renderVarietaForm(
  form: { nome: string; descrizione: string; prodottoGrezzoId: string },
  setForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; prodottoGrezzoId: string }>>,
  prodotti: ProdottoGrezzo[]
) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome varietà *" required className={inputClass} />
      <select value={form.prodottoGrezzoId} onChange={(e) => setForm((p) => ({ ...p, prodottoGrezzoId: e.target.value }))} required className={inputClass}>
        <option value="">Prodotto grezzo *</option>
        {prodotti.map((item) => (<option key={item.id} value={item.id}>{item.nome}</option>))}
      </select>
      <input value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione" className={inputClass} />
    </div>
  );
}

function renderImballaggioForm(
  form: { nome: string; descrizione: string; taraKg: string; lunghezzaCm: string; larghezzaCm: string; altezzaCm: string },
  setForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; taraKg: string; lunghezzaCm: string; larghezzaCm: string; altezzaCm: string }>>
) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome imballaggio *" required className={inputClass} />
      <input value={form.taraKg} onChange={(e) => setForm((p) => ({ ...p, taraKg: e.target.value }))} placeholder="Tara kg" type="number" step="0.01" className={inputClass} />
      <input value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione" className={inputClass} />
      <input value={form.lunghezzaCm} onChange={(e) => setForm((p) => ({ ...p, lunghezzaCm: e.target.value }))} placeholder="Lunghezza cm" type="number" className={inputClass} />
      <input value={form.larghezzaCm} onChange={(e) => setForm((p) => ({ ...p, larghezzaCm: e.target.value }))} placeholder="Larghezza cm" type="number" className={inputClass} />
      <input value={form.altezzaCm} onChange={(e) => setForm((p) => ({ ...p, altezzaCm: e.target.value }))} placeholder="Altezza cm" type="number" className={inputClass} />
    </div>
  );
}

function renderArticoloForm(
  form: { nome: string; descrizione: string; pesoPerCollo: string; pesoVariabile: boolean; vincoloProdottoGrezzoId: string; vincoloVarietaId: string },
  setForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; pesoPerCollo: string; pesoVariabile: boolean; vincoloProdottoGrezzoId: string; vincoloVarietaId: string }>>,
  prodotti: ProdottoGrezzo[],
  varietaFiltrate: Varieta[]
) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome articolo *" required className={inputClass} />
      <input value={form.pesoPerCollo} onChange={(e) => setForm((p) => ({ ...p, pesoPerCollo: e.target.value }))} placeholder="Peso per collo (kg) *" required type="number" step="0.01" min="0.01" className={inputClass} />
      <input value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione" className={inputClass} />
      <select value={form.vincoloProdottoGrezzoId} onChange={(e) => setForm((p) => ({ ...p, vincoloProdottoGrezzoId: e.target.value, vincoloVarietaId: '' }))} className={inputClass}>
        <option value="">Vincolo prodotto: nessuno</option>
        {prodotti.map((item) => (<option key={item.id} value={item.id}>{item.nome}</option>))}
      </select>
      <select
        value={form.vincoloVarietaId}
        onChange={(e) => {
          const value = e.target.value;
          const selectedVarieta = varietaFiltrate.find((item) => item.id === value);
          setForm((p) => ({
            ...p,
            vincoloVarietaId: value,
            vincoloProdottoGrezzoId: selectedVarieta ? selectedVarieta.prodottoGrezzoId : p.vincoloProdottoGrezzoId
          }));
        }}
        className={inputClass}
      >
        <option value="">Vincolo varietà: nessuno</option>
        {varietaFiltrate.map((item) => (<option key={item.id} value={item.id}>{item.nome}</option>))}
      </select>
      <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-secondary">
        <input checked={form.pesoVariabile} onChange={(e) => setForm((p) => ({ ...p, pesoVariabile: e.target.checked }))} type="checkbox" />
        Peso variabile
      </label>
      {form.vincoloVarietaId ? (
        <p className="md:col-span-3 text-xs text-secondary">Se selezioni una varietà, il prodotto viene impostato automaticamente.</p>
      ) : null}
    </div>
  );
}

function renderSiglaForm(
  form: { codice: string; produttore: string; prodottoGrezzoId: string; varietaId: string; campo: string },
  setForm: React.Dispatch<React.SetStateAction<{ codice: string; produttore: string; prodottoGrezzoId: string; varietaId: string; campo: string }>>,
  prodotti: ProdottoGrezzo[],
  varietaFiltrate: Varieta[]
) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input value={form.codice} onChange={(e) => setForm((p) => ({ ...p, codice: e.target.value }))} placeholder="Sigla lotto (es. 2012) *" required className={inputClass} />
      <input value={form.produttore} onChange={(e) => setForm((p) => ({ ...p, produttore: e.target.value }))} placeholder="Produttore *" required className={inputClass} />
      <input value={form.campo} onChange={(e) => setForm((p) => ({ ...p, campo: e.target.value }))} placeholder="Campo/appezzamento" className={inputClass} />
      <select value={form.prodottoGrezzoId} onChange={(e) => setForm((p) => ({ ...p, prodottoGrezzoId: e.target.value, varietaId: '' }))} required className={inputClass}>
        <option value="">Prodotto grezzo *</option>
        {prodotti.map((item) => (<option key={item.id} value={item.id}>{item.nome}</option>))}
      </select>
      <select value={form.varietaId} onChange={(e) => setForm((p) => ({ ...p, varietaId: e.target.value }))} required className={inputClass}>
        <option value="">Varietà *</option>
        {varietaFiltrate.map((item) => (<option key={item.id} value={item.id}>{item.nome}</option>))}
      </select>
    </div>
  );
}

function resetForms(
  setLineaForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; ordine: string }>>,
  setProdottoForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string }>>,
  setVarietaForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; prodottoGrezzoId: string }>>,
  setImballaggioForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; taraKg: string; lunghezzaCm: string; larghezzaCm: string; altezzaCm: string }>>,
  setArticoloForm: React.Dispatch<React.SetStateAction<{ nome: string; descrizione: string; pesoPerCollo: string; pesoVariabile: boolean; vincoloProdottoGrezzoId: string; vincoloVarietaId: string }>>,
  setSiglaForm: React.Dispatch<React.SetStateAction<{ codice: string; produttore: string; prodottoGrezzoId: string; varietaId: string; campo: string }>>
) {
  setLineaForm({ nome: '', descrizione: '', ordine: '' });
  setProdottoForm({ nome: '', descrizione: '' });
  setVarietaForm({ nome: '', descrizione: '', prodottoGrezzoId: '' });
  setImballaggioForm({ nome: '', descrizione: '', taraKg: '', lunghezzaCm: '', larghezzaCm: '', altezzaCm: '' });
  setArticoloForm({ nome: '', descrizione: '', pesoPerCollo: '', pesoVariabile: false, vincoloProdottoGrezzoId: '', vincoloVarietaId: '' });
  setSiglaForm({ codice: '', produttore: '', prodottoGrezzoId: '', varietaId: '', campo: '' });
}

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function uid() {
  return crypto.randomUUID();
}

function buildVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

function sortIcon(direction: SortDirection) {
  if (direction === 'asc') return '↑';
  if (direction === 'desc') return '↓';
  return '↕';
}

function PagerButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-md border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">
      {label}
    </button>
  );
}

const inputClass = 'rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary';
