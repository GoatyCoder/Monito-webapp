# DESIGN.md – Sistema di Design
**Progetto:** Monito  
**Riferimenti:** `PRD.md`, `SCHEMA.md`

---

## Palette Colori

| Token | Valore | Utilizzo |
|---|---|---|
| `primary` | `#2563EB` | Azioni principali, CTA, link, barra riepilogo |
| `secondary` | `#64748B` | Testo secondario, bordi, label, stato inattivo |
| `accent` | `#F59E0B` | Highlights, MULTI-LAVORAZIONE, Offline, peso manuale |
| `success` | `#10B981` | Conferme, stato ATTIVA, Online, % scarto bassa |
| `error` | `#EF4444` | Errori, warning critici, Conflitti, % scarto alta |
| `background` | `#F9FAFB` | Sfondo pagine |
| `surface` | `#FFFFFF` | Card, modali, header |

**Mapping stati Monito:**

| Stato | Colore |
|---|---|
| Linea ATTIVA | `success` |
| Linea INATTIVA | `secondary` |
| MULTI-LAVORAZIONE | `accent` |
| Connessione Online | `success` |
| Connessione Offline | `accent` |
| Sincronizzazione | `primary` |
| Conflitti offline | `error` |
| Avviso peso manuale | `accent` |
| % Scarto < 5% | `success` |
| % Scarto 5–15% | `accent` |
| % Scarto > 15% | `error` |

> Le soglie numeriche per % scarto sono una domanda aperta — vedi `PRD.md §Domande Aperte`.

---

## Tipografia

Font: `Inter, sans-serif` — caricato via `next/font`.

| Ruolo | Dimensione | Peso | Utilizzo |
|---|---|---|---|
| `heading-xl` | 36px | bold | Titoli pagina |
| `heading-lg` | 28px | bold | Titoli sezione, `codice_pedana` sull'etichetta |
| `heading-md` | 22px | semibold | Titoli card, titoli modali |
| `body` | 16px | regular | Testo corrente, dati principali |
| `small` | 14px | regular | Label, metadati, timestamp, dati tabelle |
| `caption` | 12px | regular | Note, testo secondario nei badge |

---

## Spaziatura (scala 4px)

| Token | Valore | Tailwind |
|---|---|---|
| `xs` | 4px | `p-1` / `gap-1` |
| `sm` | 8px | `p-2` / `gap-2` |
| `md` | 16px | `p-4` / `gap-4` |
| `lg` | 24px | `p-6` / `gap-6` |
| `xl` | 32px | `p-8` / `gap-8` |
| `2xl` | 48px | `p-12` / `gap-12` |

---

## Componenti Base

Tutti i componenti sono da shadcn/ui. Nessun CSS custom — solo Tailwind.

### Button — 4 varianti

| Variante | Stile | Quando usare |
|---|---|---|
| `primary` | bg `primary`, testo bianco | Azioni principali: Apri Lavorazione, Registra Pedana, Sì procedi |
| `secondary` | bg `surface`, bordo `secondary` | Azioni secondarie: Modifica, export |
| `ghost` | nessun sfondo | Annulla, azioni terziarie, navigazione, Apri Nuova Lavorazione |
| `danger` | bg `error`, testo bianco | Chiudi Lavorazione |

### Input
- Sempre con label sopra (small, secondary)
- Placeholder descrittivo
- Error state: bordo `error`, messaggio sotto in caption `error`
- Disabilitato: `opacity-50`, non interattivo

### Card
- `bg-surface`, `shadow-sm`, `rounded-lg` (8px)
- Card cliccabili: `hover:scale-[1.02]`, `transition duration-150 ease-in-out`
- Card linea attiva: `border-l-4` colore `success`
- Card linea con multi-lavorazione: `border-l-4` colore `accent`
- Card linea inattiva: `opacity-60`

### Modal
- Overlay: sfondo nero `opacity-50`
- Contenuto: `bg-surface`, `rounded-lg`, max-width 480px, `shadow-xl`
- Apertura: fade-in overlay + slide-up contenuto, `150ms ease-in-out`
- Titolo: `heading-md`
- Footer: sempre con `[ Annulla ] ghost` a sinistra e azione principale a destra

---

## Animazioni

| Tipo | Durata | Easing | Dove |
|---|---|---|---|
| Transizioni interazioni | 150ms | ease-in-out | Hover, focus, dropdown |
| Apertura modale | 150ms | ease-in-out | Fade overlay + slide-up contenuto |
| Loading skeleton | — | shimmer (`animate-pulse`) | Tabelle report, dati in carica |
| Hover card | 150ms | ease-in-out | `scale-[1.02]` su card cliccabili |

---

## Layout Globale

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (sticky, bg surface, shadow-sm, padding md)              │
│ Logo MONITO  |  nav: Cruscotto · Report · Anagrafiche*          │
│              |  [Stato connessione]  |  Nome utente · Ruolo     │
│                                        * solo Admin             │
├─────────────────────────────────────────────────────────────────┤
│ CONTENUTO PAGINA (bg background, padding lg)                    │
├─────────────────────────────────────────────────────────────────┤
│ FAB (fixed bottom-4 right-4, solo Operatore e Admin)            │
│ [ + Registra Scarto ]  Button primary, rounded-full, shadow-lg  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cruscotto

### Barra Riepilogo (sticky sotto header)

```
bg: primary | testo: bianco | padding: md
Linee attive: N  ·  Lavorazioni aperte: N  ·  Pedane oggi: N
Colli oggi: N    ·  Scarto oggi: N kg
```

Label: `small`. Valori: `heading-md bold`.

### Griglia Linee

- Grid CSS, 2–4 colonne responsive, `gap-lg`
- Ordine: campo `ordine` in `linee` (configurabile da Admin via input numerico)
- Linee con `attiva = false` non compaiono

### Card Linea — Inattiva

```
bg: surface | border-l-4 secondary | opacity-60

LINEA 1                          ● INATTIVA
                                 badge secondary, caption

Nessuna lavorazione in corso
small, secondary

        [ + Apri Lavorazione ]
          Button ghost
```

### Card Linea — Attiva (1 lavorazione)

```
bg: surface | border-l-4 success

LINEA 1                              ● ATTIVA
heading-md                           badge success, caption

Lotto: 2012-012      Articolo: Uva Bianca 500g
Aperta: 08:30        Imb.: Cartone 40x60
small, secondary

Pedane      Colli         Peso
  12        1.440         720 kg
heading-md, primary

[ + Pedana ]   [ Chiudi ]   [ Modifica ]
  primary        danger       secondary

[ + Apri Nuova Lavorazione ]   ghost, small
```

### Card Linea — Multi-lavorazione

```
bg: surface | border-l-4 accent

LINEA 1                    ⚠ MULTI-LAVORAZIONE
                           badge accent, caption

┌ LAVORAZIONE 1 ──────────────────────────────┐
│ bg: background | rounded-lg | padding sm    │
│ Lotto: 2012-012  │  Articolo: Uva Bianca    │
│ Pedane: 12  │  Colli: 1.440  │  Peso: 720kg │
│ [ + Pedana ]   [ Chiudi ]   [ Modifica ]    │
└─────────────────────────────────────────────┘

┌ LAVORAZIONE 2 ──────────────────────────────┐
│ bg: background | rounded-lg | padding sm    │
│ Lotto: 2012-034  │  Articolo: Uva Italia    │
│ Pedane: 3  │  Colli: 18  │  Peso: 153kg     │
│ [ + Pedana ]   [ Chiudi ]   [ Modifica ]    │
└─────────────────────────────────────────────┘

[ + Apri Nuova Lavorazione ]   ghost, small
```

---

## Modali

### Apertura Lavorazione

```
Titolo: "Apri Lavorazione — Linea X"

1. Lotto Ingresso
   Input searchable — ricerca per codice o produttore
   Risultato: codice (body) · prodotto grezzo · varietà · produttore (small secondary)

2. Articolo
   Select — disabilitato (opacity-50) finché lotto non selezionato
   Filtrato per vincoli del lotto (vedi PRD.md §Logica vincoli articolo)

3. Imballaggio Secondario
   Select — imballaggi con attivo = true

Tutti obbligatori — error state su submit se vuoti.

[ Annulla ] ghost          [ Apri Lavorazione ] primary
```

### Dialog Conferma Multi-lavorazione

Mostrata **prima** del modal apertura se la linea ha già una lavorazione aperta. Usa `AlertDialog` di shadcn/ui.

```
Icona: ⚠  colore accent
Titolo: "Lavorazione già attiva"   heading-md

"La Linea X ha già una lavorazione aperta:
[Lotto] — [Articolo]
Vuoi aprirne una seconda sulla stessa linea?"
body

[ Annulla ] secondary      [ Sì, procedi ] primary
```

### Registrazione Pedana

```
Titolo: "Registra Pedana"

Intestazione (bg background, rounded-lg, padding sm):
Linea · Lotto · Articolo   small secondary — non modificabile

1. Numero Colli
   Input numerico intero, obbligatorio, min 1

2. Peso totale (kg)
   peso_variabile = false → disabilitato (opacity-50), calcolato in tempo reale
   peso_variabile = true  → abilitato, pre-compilato con stima
     Se modificato → avviso inline sotto campo:
     "⚠ Peso inserito manualmente"  caption, accent

[ Annulla ] ghost          [ Registra Pedana ] primary

Post-submit:
  Toast success: "Pedana P26-051-0042 registrata"
  Azione nel toast: [ Stampa etichetta ]
```

### Registrazione Scarto

```
Titolo: "Registra Scarto"

1. Lotto Ingresso
   Input searchable
   Lotti con lavorazioni aperte oggi → mostrati in cima con separatore visivo

2. Colli (opzionale)
   Input numerico intero

3. Peso kg (opzionale)
   Input numerico decimale

Nota (caption, secondary): "Almeno uno tra colli e peso è obbligatorio."

Se peso_kg inserito e lotto selezionato:
  Anteprima (bg background, rounded-lg, padding sm):
  "Scarto totale dopo questa registrazione: X kg (Y%)"
  small — colore in base a soglie % (vedi palette §Mapping stati)

[ Annulla ] ghost          [ Registra Scarto ] primary
```

### Chiusura Lavorazione

```
Titolo: "Chiudi Lavorazione"

Riepilogo (bg background, rounded-lg, padding sm):
Linea · Lotto · Articolo · Pedane: N · Colli: N   small

Motivo (opzionale): Textarea

[ Annulla ] ghost          [ Chiudi Lavorazione ] danger
```

### Riapertura Lavorazione

```
Titolo: "Riapri Lavorazione"

Riepilogo (bg background, rounded-lg, padding sm):
Linea · Lotto · Articolo · Chiusa il: [data ora]   small

Motivo (opzionale): Textarea

[ Annulla ] ghost          [ Riapri Lavorazione ] primary
```

---

## Indicatore Stato Connessione (Header)

Componente `<ConnectionStatus />`. Testo `small`. Sempre visibile.

| Stato | Dot | Badge | Testo |
|---|---|---|---|
| Online | `success` | trasparente | ● Online |
| Offline | `accent` | `accent/10`, bordo `accent` | ⚠ Offline — dati salvati localmente |
| Sincronizzazione | `primary` | `primary/10` | ↻ Sincronizzazione... |
| Conflitti (Admin) | `error` | `error/10`, bordo `error` | ⛔ N conflitti da risolvere |

---

## Etichetta Pedana

Componente `<PedanaLabel />` — ottimizzato per `react-to-print`. Larghezza fissa 10cm.

```
┌─────────────────────────────────┐
│ MONITO              caption     │
├─────────────────────────────────┤
│ Prodotto:  Uva da Tavola        │
│ Varietà:   Italia               │
│ Articolo:  Uva Italia 500g      │
│            small                │
├─────────────────────────────────┤
│ Colli: 60       Peso: 30 kg     │
│         body bold               │
├─────────────────────────────────┤
│ Lotto: 2012-012                 │
│ Data:  15/01/2026               │
│        small                    │
├─────────────────────────────────┤
│ P26-015-0042                    │
│ heading-lg bold primary         │
└─────────────────────────────────┘
```

`codice_pedana` in `heading-lg bold` — deve essere leggibile a distanza. Formato: `PYY-DOY-NNNN`. Vedi `SCHEMA.md §pedane`.

---

## Sezione Report

```
Filtro data: [ Data inizio ] → [ Data fine ]   [ Applica ]  Button secondary

Tab: [ Per Lotto ] [ Per Linea ] [ Per Articolo ]

Export: [ PDF ] [ Excel ] [ CSV ]   Button secondary, small

Tabella:
  bg: surface | rounded-lg | shadow-sm
  Header colonne: small semibold secondary
  Righe dati: small body
  Hover riga: bg background
  Loading: skeleton shimmer sull'intera tabella
```

### Per Lotto Ingresso
Colonne: Lotto · Prodotto · Varietà · Produttore · Pedane · Colli · Peso totale · Scarto kg · Scarto colli · % Scarto · Linee · Articoli

`% Scarto` colorata in base alle soglie definite in `PRD.md §Domande Aperte`.

### Per Linea
Colonne: Linea · Lavorazioni · Lotti lavorati · Pedane · Colli · Peso totale · Tempo attivo

Tempo attivo = somma `(chiusa_at - aperta_at)` delle lavorazioni chiuse nella giornata selezionata.

### Per Articolo
Colonne: Articolo · Pedane totali · Colli totali · Peso totale · Lotti coinvolti


## Sezione Anagrafiche (Admin)

Layout gestionale composto da:

- Barra tab orizzontale con 6 entità (`Prodotti grezzi`, `Varietà`, `Articoli`, `Imballaggi`, `Linee`, `Sigle lotto`)
- Header sezione con titolo tab attiva, descrizione e CTA primaria `+ Nuovo record`
- Tabella con colonne ordinabili (click su header, stato visualizzato con freccia `↑` / `↓`)
- Colonna azioni con `Modifica`, `Disattiva/Ripristina` e `Elimina definitiva`
- Footer tabella con paginazione (`Precedente`, `Successiva`) e contatore record

### Modali Anagrafiche

- Modale unica per creazione e modifica record
- Overlay scuro (`bg-slate-900/60`) e card centrale `surface` con border radius `xl`
- Form su griglia responsive (1 colonna mobile, 2 desktop)
- Azioni allineate a destra: `Annulla` (secondary), `Crea record` / `Salva modifiche` (primary)

### Dialog Conferma Eliminazione Definitiva

Mostrata quando l'Admin seleziona `Elimina definitiva` su un record anagrafica.

```
Icona: ⚠ colore error
Titolo: "Conferma eliminazione definitiva"

"Stai eliminando definitivamente questo record.
L'operazione è irreversibile e applica la cascata ON DELETE CASCADE
dove prevista nello schema database. Vuoi procedere?"

[ Annulla ] secondary      [ Conferma ] danger
```

### Stati e feedback

- Messaggio di stato persistente in testa pagina (successo o errore)
- Righe disattivate visualizzate con contrasto ridotto (`bg-slate-50` + testo muted)
- Empty state tabellare: `Nessun record presente.`
