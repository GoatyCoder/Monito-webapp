# Monito Webapp

Sistema di monitoraggio della produzione ortofrutticola.

## Stack

Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel

## Documentazione

| File | Contenuto |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Requisiti, obiettivi, ruoli, funzionalità, comportamenti, NFR |
| [`docs/Design.md`](docs/Design.md) | Design system, palette, componenti, layout, modali |
| [`docs/Schema.md`](docs/Schema.md) | Architettura DB, schemi PostgreSQL, migration SQL, tipi TypeScript |
| [`docs/TODO.md`](docs/TODO.md) | Roadmap tecnica, stato avanzamento, codice da aggiungere |
| [`AGENTS.md`](AGENTS.md) | Regole operative per agenti AI |

> Ordine di lettura consigliato: PRD → Design → Schema → TODO.

## Convenzioni

- **Soft delete** su tutte le anagrafiche: `is_active`, `deleted_at`, `deleted_by`. Mai `DELETE` fisico.
- **Audit** su ogni modifica: riga in `audit.log` con `schema_name`, `table_name`, `record_id`, `action`.
- **Schema operativo attivo**: configurato in `src/lib/config/db.ts` — aggiornare ogni 1 gennaio.
- **Naming**: commenti in italiano, variabili e funzioni in inglese.

## Sviluppo locale

```bash
cp .env.example .env.local   # compilare con valori reali
npm install
npm run dev
```

Verifiche pre-commit:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy

### Prima volta

1. Crea un progetto su [supabase.com](https://supabase.com) (region: West EU)
2. **Supabase → Project Settings → Integrations → Vercel → Connect** — seleziona il repo e il branch `main`. Supabase inietta automaticamente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
3. Esegui le migration SQL in `docs/Schema.md §Migration SQL` nell'ordine indicato.
4. Crea il primo utente Admin: **Supabase → Authentication → Users → Add user**, poi assegna il ruolo con la query in `docs/Schema.md §Utenti`.
5. Abilita Realtime: **Supabase → Database → Replication** — attiva `ops_2025.lavorazioni`, `ops_2025.pedane`, `ops_2025.scarti`.
6. Committa le modifiche al codice elencate in `docs/TODO.md §Foundation` su `main` — Vercel esegue il deploy automaticamente.

### Ogni 1 gennaio

Vedi `docs/Schema.md §Manutenzione annuale`.

### Rollback

Su Vercel: seleziona un deploy precedente stabile e promuovilo.
