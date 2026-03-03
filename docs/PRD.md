# PRD.md – Product Requirements Document
**Progetto:** Monito  
**Dominio:** Monitoraggio Produzione Ortofrutticola  
**Riferimenti:** `DESIGN.md`, `SCHEMA.md`

---

## Contesto

Monito è il sistema informativo interno per il monitoraggio della produzione in un'azienda ortofrutticola specializzata nel confezionamento e imballaggio di prodotti freschi (uva da tavola, albicocche, mandarini e altri).

Il sistema fornisce un cruscotto in tempo reale sullo stato delle linee di produzione, la registrazione strutturata degli eventi produttivi (lavorazioni, pedane, scarti) e i report gestionali necessari al controllo della produzione, nel rispetto degli standard di tracciabilità GS1 e delle normative di settore.

---

## Obiettivi

### v1
- Fornire visibilità in tempo reale sullo stato di tutte le linee attive durante il turno
- Registrare lavorazioni, pedane e scarti in modo strutturato e tracciabile
- Garantire la tracciabilità completa del prodotto tramite sigla lotto + data ingresso (DOY derivabile) (standard GS1, Reg. CE 178/2002)
- Calcolare automaticamente le percentuali di scarto per lotto
- Produrre report gestionali esportabili (PDF, Excel, CSV) per linea, lotto e articolo
- Mantenere un audit log completo e immutabile su tutte le operazioni

### Fuori Scope (v1)
- Integrazione con sistemi ERP o gestionali esterni
- Gestione ricezione materia prima (DDT in ingresso) e spedizioni
- Etichettatura con SSCC e GTIN completo GS1
- Utilizzo su dispositivi mobili (tablet/smartphone)
- Dashboard analytics avanzate (trend, KPI storici)
- Gestione turni con report separati

---

## Utenti e Ruoli

| Ruolo | Chi è | Cosa può fare |
|---|---|---|
| **Admin** | Responsabile sistema | Gestione completa anagrafiche e utenti. Accesso audit log. Risoluzione conflitti offline. Configurazione sistema. |
| **Operatore** | Addetto al monitoraggio | Apertura/chiusura/riapertura lavorazioni. Registrazione pedane e scarti. Modifica dati inseriti. Cruscotto in lettura/scrittura. |
| **Viewer** | Responsabile produzione, Direzione | Cruscotto in sola lettura. Accesso ai report. Nessuna modifica. |

Un Operatore può gestire più linee da una singola postazione. Più Operatori possono lavorare contemporaneamente su linee diverse senza conflitti.

---

## Stack Tecnologico

| Layer | Tecnologia | Versione | Ruolo |
|---|---|---|---|
| Frontend | Next.js (App Router) | 14.x | Framework React, routing |
| Styling | Tailwind CSS | 3.4.x | Utility-first CSS — nessun CSS custom |
| Componenti UI | shadcn/ui | latest | Componenti accessibili prebuilt |
| Backend / DB | Supabase (PostgreSQL) | latest | Database, Auth, REST API, Realtime |
| Offline / Sync | Dexie.js (IndexedDB) | 3.x | Storage locale per modalità offline |
| Service Worker | next-pwa | latest | PWA per funzionamento offline |
| Stampa etichette | react-to-print | latest | Stampa etichetta da browser |
| Export PDF | @react-pdf/renderer | latest | Generazione PDF report lato client |
| Export Excel / CSV | SheetJS (xlsx) | latest | Generazione file Excel e CSV |
| Language | TypeScript | 5.x | Tipizzazione strict |
| Deploy Frontend | Vercel | — | CI/CD automatico da GitHub |
| Deploy Backend | Supabase Cloud | — | Piano free: 2 progetti, 500MB DB |

### Convenzioni di Codice
- TypeScript strict mode — nessun `any` esplicito, nessun `// @ts-ignore`
- Componenti: `PascalCase`. File: `kebab-case`. Cartelle: `lowercase`
- Componenti UI in `src/components/`. Logica business in `src/lib/`
- Tipi condivisi in `src/types/`. Query Supabase in `src/lib/db/`
- Commenti nel codice: italiano. Nomi variabili e funzioni: inglese
- Nessuna libreria esterna aggiunta senza decisione esplicita

---

## Funzionalità

### Cruscotto Produzione
- Aggiornamento realtime via Supabase Realtime (websocket), latenza max 5 secondi
- Griglia responsive 2–4 colonne, supporta 9+ linee
- Barra riepilogo sticky con totali del giorno corrente (reset a mezzanotte)
- FAB sempre visibile per registrazione scarto rapida (solo Operatore e Admin)
- Viewer: sola lettura, pulsanti azione nascosti

### Gestione Lavorazioni
- **Apertura:** linea + sigla lotto + data ingresso (oppure DOY con conversione automatica in data) + articolo (filtrato per vincoli) + imballaggio secondario. Timestamp automatico.
- **Chiusura:** manuale dall'Operatore. Timestamp automatico.
- **Riapertura:** permessa a Operatore e Admin. Tracciata in audit log con motivo opzionale. Le pedane post-riapertura si aggiungono alle esistenti.
- **Modifica:** correzione lotto o articolo su lavorazione aperta. Le pedane già registrate restano associate all'articolo originale. Audit log obbligatorio.

### Registrazione Pedane
- Selezione lavorazione → inserimento colli → peso calcolato o sovrascrivibile
- Massimo 3 interazioni per registrare una pedana
- Modifica pedana possibile, tracciata in audit log
- Al completamento: `codice_pedana` generato (`PYY-DOY-NNNN`), etichetta disponibile per stampa

### Registrazione Scarti
- Accessibile sempre dal FAB
- Sigla lotto + data ingresso + colli (opzionale) + peso kg (opzionale). Almeno un campo obbligatorio.
- Più registrazioni sullo stesso lotto vengono sommate
- Percentuale scarto ricalcolata e mostrata in anteprima prima del salvataggio

### Etichetta Pedana
Stampata via `react-to-print`. Contenuto: Prodotto Grezzo, Varietà, Articolo, Colli, Peso, Lotto ingresso, Data confezionamento, `codice_pedana` (in grande).

### Anagrafiche (Admin)
Linee, Prodotti Grezzi, Varietà, Imballaggi Secondari, Articoli, Sigle Lotto. Disponibili sia soft delete (`is_active = false`, `deleted_at`, `deleted_by`) sia eliminazione fisica definitiva riservata all'Admin con dialog di conferma. L'eliminazione definitiva usa vincoli `ON DELETE CASCADE` dove definiti nello schema. Vedi dettagli in `SCHEMA.md`.

Interfaccia Admin v1: tab per entità, tabella ordinabile cliccando sull'header, paginazione, modale di creazione/modifica, azione inline di disattivazione/ripristino e azione di eliminazione definitiva con conferma.

### Report
Filtro per data o intervallo. Export PDF, Excel, CSV.
- **Per Lotto (sigla + data ingresso):** pedane, colli, peso totale, scarto (kg/colli/%), linee coinvolte, articoli prodotti
- **Per Linea:** lavorazioni del giorno, lotti lavorati, pedane/colli/peso, tempo attivo (somma `chiusa_at - aperta_at` delle lavorazioni chiuse)
- **Per Articolo:** colli e pedane totali aggregati

---

## Comportamenti di Sistema

> Ogni caso è esplicitamente definito. Nessuno è lasciato all'interpretazione in fase di sviluppo.

| Caso | Comportamento |
|---|---|
| Apertura lavorazione su linea già attiva | Dialog di conferma esplicita obbligatoria prima di procedere. Vedi `DESIGN.md §5.1`. |
| Più lavorazioni sulla stessa linea | Permesso dopo conferma. Badge "⚠ MULTI-LAVORAZIONE" sulla card. Ogni lavorazione ha il proprio `+ Pedana`. |
| Riapertura lavorazione chiusa | Permessa. Tracciata in audit log (chi, quando, motivo opzionale). |
| Modifica articolo su lavorazione aperta | Permessa. Pedane già registrate restano all'articolo originale. Solo le nuove usano il nuovo articolo. Audit log obbligatorio. |
| Articolo con vincolo incompatibile col lotto | Non compare nel dropdown. Nessun messaggio di errore. |
| Peso variabile non modificato | Registra il peso stimato. Nessun avviso. |
| Peso variabile modificato | Registra il peso inserito. Avviso visivo "⚠ Peso inserito manualmente". Non bloccante. |
| Pedana con peso zero | Bloccata. Il sistema non permette la registrazione. |
| Scarto senza lavorazioni aperte | Permesso. L'Operatore inserisce sigla lotto + data ingresso. |
| Reset totali cruscotto | Totali barra riepilogo riferiti al giorno corrente (dalla mezzanotte). |
| Lavorazione aperta il giorno precedente | Resta visibile nel cruscotto fino a chiusura manuale. Attribuita alla data di apertura nei report. |
| Cancellazione record | Nelle anagrafiche sono disponibili soft delete e hard delete. L'hard delete è riservato all'Admin, richiede dialog di conferma ed esegue cascata secondo i vincoli `ON DELETE CASCADE` del DB. I dati operativi restano tracciati in audit. |

---

## Audit Log

Copre tutte le tabelle: anagrafiche, lavorazioni, pedane, scarti. Ogni INSERT, UPDATE, soft delete, restore e hard delete genera una riga. Immutabile: solo INSERT permesso, mai UPDATE o DELETE. Accessibile in lettura solo all'Admin. Vedi struttura completa in `SCHEMA.md §audit_log`.

---

## Offline & Sincronizzazione

- Modalità offline: registrazione di lavorazioni, pedane e scarti tramite IndexedDB (Dexie.js) via Service Worker (next-pwa)
- Al ripristino connessione: sincronizzazione automatica in background
- Indicatore stato connessione sempre visibile in header. Vedi `DESIGN.md §9`.
- In caso di conflitti: notifica all'Admin, risoluzione manuale tramite interfaccia dedicata

---

## Requisiti Non Funzionali

| Parametro | Valore |
|---|---|
| Tipo | Web application PWA — Chrome, Edge |
| Dispositivi target | PC Windows con monitor, postazione fissa |
| Multi-utente | Più Operatori contemporaneamente senza conflitti |
| Linee supportate | Configurabile, nessun limite predefinito |
| Latenza cruscotto | Max 5 secondi (Supabase Realtime) |
| Interazioni per pedana | Max 3 |
| Volumi attesi | ~500 pedane/giorno, ~50 lavorazioni/giorno, ~20 scarti/giorno |
| Autenticazione | Supabase Auth, email + password |
| Autorizzazione | RLS su tutte le tabelle Supabase |
| Timeout sessione | Configurabile dall'Admin (default: 8 ore) |
| Conformità | GS1 (struttura lotti sigla + DOY), Reg. CE 178/2002 |

---

## Glossario

| Termine | Definizione |
|---|---|
| **Prodotto Grezzo** | Categoria merceologica della materia prima (es. Uva da Tavola). Contiene le varietà. |
| **Varietà** | Cultivar specifica (es. Crimson, Italia, Victoria). Sempre legata a un prodotto grezzo. |
| **Sigla Lotto** | Codice partita: produttore + prodotto grezzo + varietà + campo (es. "2012"). |
| **Lotto Ingresso** | Identificatore operativo derivato da sigla lotto + data ingresso (DOY calcolabile). |
| **DOY** | Day of Year — numero progressivo del giorno nell'anno (es. 012 = 12 gennaio). |
| **Articolo / Lavorato** | Prodotto confezionato finito. Può avere vincoli su prodotto grezzo e/o varietà. |
| **Lavorazione** | Sessione operativa: linea + sigla lotto + data ingresso + articolo + imballaggio secondario. |
| **Pedana** | Unità di spedizione: colli omogenei dello stesso articolo, registrata come evento al completamento. |
| **codice_pedana** | ID leggibile stampato sull'etichetta. Formato `PYY-DOY-NNNN` (es. `P26-051-0042`). |
| **Scarto** | Materiale non idoneo, registrato in colli e/o kg a livello di sigla lotto + data ingresso. |
| **Bins** | Contenitore grande per prodotto sfuso o scarto (~250–300 kg). |
| **GS1** | Standard internazionali per identificazione prodotti e tracciabilità supply chain. |
| **Audit Log** | Registro immutabile di tutte le operazioni: chi, cosa, quando, valore precedente e nuovo. |
| **PWA** | Progressive Web App — funziona offline tramite Service Worker e cache locale. |
| **RLS** | Row Level Security — controllo accesso ai dati per ruolo a livello di database (Supabase). |
| **FAB** | Floating Action Button — pulsante fisso per azioni rapide (es. Registra Scarto). |

---

## Domande Aperte

| Domanda | Quando decidere |
|---|---|
| Interfaccia risoluzione conflitti offline (Admin) — wireframe da progettare | Prima dello sviluppo modulo sync |
| Timeout sessione: confermare 8 ore come default | Prima del deploy |
| Soglie colore % scarto nei report (es. verde < 5%, giallo 5–15%, rosso > 15%) | Prima dello sviluppo modulo report |
