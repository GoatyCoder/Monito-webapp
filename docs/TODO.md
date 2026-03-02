# TODO Implementazione (Roadmap tecnica)

## Foundation
- [ ] Configurare progetto Next.js reale (`create-next-app`) mantenendo questa struttura.
- [ ] Installare dipendenze indicate in PRD (Supabase, Dexie, shadcn/ui, export tools).
- [ ] Configurare CI base (lint + typecheck).

## Auth & Ruoli
- [ ] Integrare Supabase Auth (email/password).
- [ ] Gestire ruoli `admin`, `operatore`, `viewer` lato UI e lato query.
- [ ] Proteggere route sensibili (es. anagrafiche admin-only).

## Anagrafiche (Admin)
- [x] Implementare pagina `/anagrafiche` con vista gestionale moderna e navigazione per entità (Linee, Prodotti Grezzi, Varietà, Imballaggi Secondari, Articoli, Sigle Lotto).
- [x] Aggiungere filtri avanzati combinabili (ricerca testuale, stato, dominio, creato da) con reset rapido.
- [x] Implementare ordinamento tri-stato sugli header tabella (`asc` → `desc` → neutro).
- [x] Implementare multipaging (selezione righe/pagina + navigazione prima/prec/pagine/succ/ultima).
- [ ] Collegare la vista a dati reali Supabase (rimozione dataset mock locale).
- [ ] Aggiungere operazioni CRUD complete con soft delete/restore e tracciamento `audit_log`.

## Cruscotto
- [ ] Collegare summary bar a metriche realtime.
- [ ] Implementare card linea inattiva/attiva/multi-lavorazione da dataset reale.
- [ ] Aggiungere modali apertura/chiusura/riapertura/modifica lavorazione.

## Pedane e Scarti
- [ ] Implementare modal registrazione pedana con regole peso variabile.
- [ ] Generare e mostrare `codice_pedana` con stampa etichetta.
- [ ] Implementare FAB + modal registrazione scarto con anteprima percentuale.

## Report
- [ ] Implementare filtri data/intervallo.
- [ ] Implementare tab Lotto/Linea/Articolo.
- [ ] Aggiungere export PDF / Excel / CSV.

## Offline & Sync
- [ ] Configurare next-pwa + service worker.
- [ ] Implementare coda offline Dexie e retry automatico.
- [ ] Implementare gestione conflitti con vista admin dedicata.

## Data & Compliance
- [ ] Tradurre `docs/Schema.md` in migration SQL versionate.
- [ ] Attivare policy RLS complete su tutte le tabelle.
- [ ] Aggiungere audit log automatico per operazioni richieste.
