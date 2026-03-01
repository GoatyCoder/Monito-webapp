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
- PRD e Design rimandano a Schema per vincoli, audit e regole DB.
- TODO traduce i requisiti in attività implementative.
- Ogni nuova feature deve aggiornare in modo coerente PRD/Design/Schema/TODO.

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

## Stato repository

Il repository contiene documentazione e skeleton iniziale. L’implementazione applicativa deve seguire i vincoli descritti nei documenti in `docs/` e mantenere `README.md` + `docs/TODO.md` sincronizzati con l’avanzamento del progetto.
