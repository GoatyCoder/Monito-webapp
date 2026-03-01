'use client';

import { FormEvent, useMemo, useState } from 'react';

type BaseRecord = {
  id: string;
  nome: string;
  attivo: boolean;
};

type NamedRegistryKey = 'linee' | 'prodottiGrezzi' | 'imballaggiSecondari';

const NAMED_REGISTRY_LABELS: Record<NamedRegistryKey, string> = {
  linee: 'Linee',
  prodottiGrezzi: 'Prodotti Grezzi',
  imballaggiSecondari: 'Imballaggi Secondari'
};

const seedNamedRegistries: Record<NamedRegistryKey, BaseRecord[]> = {
  linee: [
    { id: 'ln-001', nome: 'Linea 1', attivo: true },
    { id: 'ln-002', nome: 'Linea 2', attivo: true }
  ],
  prodottiGrezzi: [
    { id: 'pg-001', nome: 'Uva da Tavola', attivo: true },
    { id: 'pg-002', nome: 'Pomodoro', attivo: false }
  ],
  imballaggiSecondari: [
    { id: 'imb-001', nome: 'Cartone 40x60', attivo: true },
    { id: 'imb-002', nome: 'Bins', attivo: true }
  ]
};

type VarietaRecord = BaseRecord & {
  prodottoGrezzoId: string;
};

const seedVarieta: VarietaRecord[] = [
  { id: 'var-001', nome: 'Crimson', prodottoGrezzoId: 'pg-001', attivo: true },
  { id: 'var-002', nome: 'Italia', prodottoGrezzoId: 'pg-001', attivo: true }
];

type ArticoloRecord = BaseRecord & {
  pesoPerCollo: number;
  pesoVariabile: boolean;
};

const seedArticoli: ArticoloRecord[] = [
  { id: 'art-001', nome: 'Vaschetta 500g', pesoPerCollo: 5, pesoVariabile: false, attivo: true },
  { id: 'art-002', nome: 'Cassetta 7kg', pesoPerCollo: 7, pesoVariabile: true, attivo: true }
];

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export default function AnagrafichePage() {
  const [namedRegistries, setNamedRegistries] = useState(seedNamedRegistries);
  const [varieta, setVarieta] = useState(seedVarieta);
  const [articoli, setArticoli] = useState(seedArticoli);

  const [lineaNome, setLineaNome] = useState('');
  const [prodottoNome, setProdottoNome] = useState('');
  const [imballaggioNome, setImballaggioNome] = useState('');

  const [varietaNome, setVarietaNome] = useState('');
  const [varietaProdottoId, setVarietaProdottoId] = useState(seedNamedRegistries.prodottiGrezzi[0]?.id ?? '');

  const [articoloNome, setArticoloNome] = useState('');
  const [pesoPerCollo, setPesoPerCollo] = useState('');
  const [pesoVariabile, setPesoVariabile] = useState(false);

  const prodottiAttivi = useMemo(
    () => namedRegistries.prodottiGrezzi.filter((prodotto) => prodotto.attivo),
    [namedRegistries.prodottiGrezzi]
  );

  const toggleRecord = (key: NamedRegistryKey, id: string) => {
    setNamedRegistries((prev) => ({
      ...prev,
      [key]: prev[key].map((record) => (record.id === id ? { ...record, attivo: !record.attivo } : record))
    }));
  };

  const addNamedRecord = (key: NamedRegistryKey, value: string) => {
    const nome = value.trim();
    if (!nome) return;

    setNamedRegistries((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: createId(key.slice(0, 3)), nome, attivo: true }]
    }));
  };

  const onSubmitLinea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addNamedRecord('linee', lineaNome);
    setLineaNome('');
  };

  const onSubmitProdotto = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addNamedRecord('prodottiGrezzi', prodottoNome);
    setProdottoNome('');
  };

  const onSubmitImballaggio = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addNamedRecord('imballaggiSecondari', imballaggioNome);
    setImballaggioNome('');
  };

  const onSubmitVarieta = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nome = varietaNome.trim();
    if (!nome || !varietaProdottoId) return;

    setVarieta((prev) => [...prev, { id: createId('var'), nome, prodottoGrezzoId: varietaProdottoId, attivo: true }]);
    setVarietaNome('');
  };

  const onSubmitArticolo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nome = articoloNome.trim();
    const peso = Number(pesoPerCollo);
    if (!nome || Number.isNaN(peso) || peso <= 0) return;

    setArticoli((prev) => [...prev, { id: createId('art'), nome, pesoPerCollo: peso, pesoVariabile, attivo: true }]);

    setArticoloNome('');
    setPesoPerCollo('');
    setPesoVariabile(false);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Anagrafiche</h1>
        <p className="text-secondary">
          Gestione locale delle anagrafiche principali: creazione record e attivazione/disattivazione.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RegistryCard
          title={NAMED_REGISTRY_LABELS.linee}
          records={namedRegistries.linee}
          inputValue={lineaNome}
          setInputValue={setLineaNome}
          onSubmit={onSubmitLinea}
          onToggle={(id) => toggleRecord('linee', id)}
          placeholder="Nuova linea"
        />

        <RegistryCard
          title={NAMED_REGISTRY_LABELS.prodottiGrezzi}
          records={namedRegistries.prodottiGrezzi}
          inputValue={prodottoNome}
          setInputValue={setProdottoNome}
          onSubmit={onSubmitProdotto}
          onToggle={(id) => toggleRecord('prodottiGrezzi', id)}
          placeholder="Nuovo prodotto grezzo"
        />

        <RegistryCard
          title={NAMED_REGISTRY_LABELS.imballaggiSecondari}
          records={namedRegistries.imballaggiSecondari}
          inputValue={imballaggioNome}
          setInputValue={setImballaggioNome}
          onSubmit={onSubmitImballaggio}
          onToggle={(id) => toggleRecord('imballaggiSecondari', id)}
          placeholder="Nuovo imballaggio"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">Varietà</h2>
          <form className="mb-4 space-y-2" onSubmit={onSubmitVarieta}>
            <input
              value={varietaNome}
              onChange={(event) => setVarietaNome(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nuova varietà"
            />
            <select
              value={varietaProdottoId}
              onChange={(event) => setVarietaProdottoId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {prodottiAttivi.map((prodotto) => (
                <option key={prodotto.id} value={prodotto.id}>
                  {prodotto.nome}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-white">
              Aggiungi varietà
            </button>
          </form>
          <ul className="space-y-2 text-sm">
            {varieta.map((record) => {
              const parent = namedRegistries.prodottiGrezzi.find((item) => item.id === record.prodottoGrezzoId);
              return (
                <li key={record.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                  <div>
                    <p className="font-medium">{record.nome}</p>
                    <p className="text-xs text-secondary">Prodotto: {parent?.nome ?? 'N/D'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVarieta((prev) =>
                        prev.map((item) => (item.id === record.id ? { ...item, attivo: !item.attivo } : item))
                      )
                    }
                    className={`rounded px-2 py-1 text-xs ${
                      record.attivo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {record.attivo ? 'Attiva' : 'Disattiva'}
                  </button>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium">Articoli</h2>
          <form className="mb-4 space-y-2" onSubmit={onSubmitArticolo}>
            <input
              value={articoloNome}
              onChange={(event) => setArticoloNome(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nuovo articolo"
            />
            <input
              value={pesoPerCollo}
              onChange={(event) => setPesoPerCollo(event.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Peso per collo (kg)"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={pesoVariabile}
                onChange={(event) => setPesoVariabile(event.target.checked)}
              />
              Peso variabile
            </label>
            <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-white">
              Aggiungi articolo
            </button>
          </form>
          <ul className="space-y-2 text-sm">
            {articoli.map((record) => (
              <li key={record.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <div>
                  <p className="font-medium">{record.nome}</p>
                  <p className="text-xs text-secondary">
                    {record.pesoPerCollo} kg/collo {record.pesoVariabile ? '• Peso variabile' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setArticoli((prev) =>
                      prev.map((item) => (item.id === record.id ? { ...item, attivo: !item.attivo } : item))
                    )
                  }
                  className={`rounded px-2 py-1 text-xs ${
                    record.attivo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {record.attivo ? 'Attivo' : 'Disattivo'}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

type RegistryCardProps = {
  title: string;
  records: BaseRecord[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggle: (id: string) => void;
  placeholder: string;
};

function RegistryCard({
  title,
  records,
  inputValue,
  setInputValue,
  onSubmit,
  onToggle,
  placeholder
}: RegistryCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-white">
          Aggiungi
        </button>
      </form>
      <ul className="space-y-2 text-sm">
        {records.map((record) => (
          <li key={record.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
            <span>{record.nome}</span>
            <button
              type="button"
              onClick={() => onToggle(record.id)}
              className={`rounded px-2 py-1 text-xs ${
                record.attivo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {record.attivo ? 'Attivo' : 'Disattivo'}
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
