# Monito Webapp

Documentazione iniziale del progetto **Monito**, sistema per il monitoraggio della produzione ortofrutticola.

## Documentazione di riferimento

Nella cartella `docs/` trovi i documenti principali:

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document (obiettivi, scope, ruoli, funzionalità, comportamenti, NFR).
- [`docs/Design.md`](docs/Design.md) — Design system (palette, tipografia, componenti, layout, modali, report UI).
- [`docs/Schema.md`](docs/Schema.md) — Schema database Supabase/PostgreSQL (tabelle, trigger, indici, RLS).
- [`docs/TODO.md`](docs/TODO.md) — Roadmap tecnica operativa delle funzionalità da implementare.

> Questi documenti sono la **fonte di verità** per decisioni funzionali, UX/UI, dati e piano di implementazione.

## Come usare la documentazione

### Ordine consigliato di lettura

1. **PRD** → capisci cosa deve fare il prodotto.
2. **Design** → definisci come si presenta e come interagisce l’utente.
3. **Schema** → implementa persistenza, regole dati e sicurezza.
4. **TODO** → pianifica e traccia lo stato di avanzamento tecnico.

### Tracciabilità tra documenti

- PRD rimanda ai dettagli visuali su Design.
- PRD e Design rimandano a Schema per vincoli, audit e regole DB (incluse convenzioni `is_active/deleted_*` e `audit_log`).
- TODO traduce i requisiti in attività implementative.
- Ogni nuova feature deve aggiornare in modo coerente PRD/Design/Schema/TODO.


## Data conventions (audit & soft delete)

- Audit metadata standard sulle tabelle applicative: `created_at`, `created_by`, `updated_at`, `updated_by`.
- `audit_log` è append-only e usa naming in inglese: `event_at`, `actor_id`, `actor_name`, `table_name`, `action`, `field_name`, `old_value`, `new_value`, `reason`.
- Soft delete sulle anagrafiche con naming in inglese: `is_active`, `deleted_at`, `deleted_by` (no delete fisico).

## Istruzioni operative per agenti (AI/Codex)

Quando un agente contribuisce a questo repository, deve rispettare queste regole:

1. **Allineamento documentale obbligatorio**
   - Prima di proporre codice o modifiche architetturali, consultare:
     - `docs/PRD.md`
     - `docs/Design.md`
     - `docs/Schema.md`
     - `docs/TODO.md`
2. **Coerenza cross-file**
   - Se cambia un requisito funzionale, aggiornare PRD.
   - Se cambia un comportamento UI/UX, aggiornare Design.
   - Se cambia struttura dati o regole DB/RLS, aggiornare Schema.
   - Se cambia stato lavori/priorità tecniche, aggiornare TODO.
3. **Aggiornamento continuo della documentazione**
   - Non lasciare documenti disallineati: ogni PR deve mantenere README e file `docs/` aggiornati rispetto allo stato reale del progetto.
4. **Nessuna ambiguità**
   - In caso di conflitto tra implementazione e documentazione, privilegiare la documentazione e aprire una proposta di aggiornamento esplicita.
5. **Naming e convenzioni**
   - Mantenere naming coerente con i documenti (`lavorazioni`, `pedane`, `scarti`, `audit_log`, ecc.).
6. **Deliverable minimi in PR**
   - Ogni PR deve indicare chiaramente quali sezioni di PRD/Design/Schema/TODO sono state rispettate o aggiornate.

## Quando l'agente DEVE fermarsi e chiedere

- Se un comportamento richiesto non è definito in `docs/PRD.md` (sezione comportamenti di sistema).
- Se serve introdurre una libreria non prevista nello stack documentato in `docs/PRD.md`.
- Se esistono due implementazioni equivalenti dello stesso requisito e manca un criterio di scelta esplicito.
- Se trova conflitti tra `README.md` e i file in `docs/` (PRD/Design/Schema/TODO).

## Stato repository

Il repository contiene documentazione e skeleton iniziale. L’implementazione applicativa deve seguire i vincoli descritti nei documenti in `docs/` e mantenere `README.md` + `docs/TODO.md` sincronizzati con l’avanzamento del progetto.

## Guida passo passo per il deploy

Di seguito trovi una procedura standard per pubblicare l’app in produzione.

### 1) Prerequisiti

- Node.js 20+ installato localmente.
- Accesso al repository Git.
- Variabili ambiente di produzione pronte (es. Supabase URL e key).

### 2) Installa le dipendenze

```bash
npm install
```

### 3) Configura le variabili ambiente

1. Crea un file `.env.local` per i test locali, usando `.env.example` come template. Assicurati che `.env.example` sia sempre aggiornato e versionato.
2. Inserisci in piattaforma di hosting le stesse variabili con i valori di produzione.
3. Verifica che tutte le variabili elencate in `.env.example` siano valorizzate correttamente.

> Non committare mai file `.env*` con segreti reali.

### 4) Esegui i controlli prima del deploy

```bash
npm run lint
npm run typecheck
npm run build
```

Se uno di questi comandi fallisce, correggi gli errori prima di continuare.

> **Nota:** Se `npm run lint` avvia una configurazione interattiva, completala e committa i file generati (es. `.eslintrc.json`) per rendere il comando non interattivo nelle esecuzioni future.

### 5) Deploy su Vercel (consigliato per Next.js)

1. Crea un nuovo progetto su Vercel e collega il repository.
2. Imposta framework **Next.js** (rilevato automaticamente nella maggior parte dei casi).
3. Aggiungi tutte le variabili ambiente nel pannello **Settings → Environment Variables**.
4. Avvia il deploy del branch principale (`main` o branch concordato).
5. Verifica che lo stato build sia `Ready` e apri la URL generata.

### 6) Verifica post-deploy

- Apri dashboard, anagrafiche e report.
- Verifica caricamento dati da Supabase.
- Controlla console browser e log runtime per errori.
- Esegui un test rapido di regressione sui flussi principali.

### 7) Rollback (se necessario)

- Su Vercel: vai nella lista deploy, seleziona un deploy precedente stabile e promuovilo.
- In alternativa, ripristina un commit stabile e rilancia il deploy.
