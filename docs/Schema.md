# SCHEMA.md – Database Schema
**Progetto:** Monito  
**Riferimenti:** `PRD.md`, `DESIGN.md`

---

## Convenzioni

- Ogni tabella ha `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` e `created_at timestamptz DEFAULT now()`
- Le anagrafiche (`prodotti_grezzi`, `varieta`, `articoli`, `imballaggi_secondari`, `linee`, `sigle_lotto`) tracciano anche `created_by`, `updated_at`, `updated_by`
- Nessun record viene cancellato fisicamente — le anagrafiche hanno `attivo boolean DEFAULT true`
- I dati produttivi (lavorazioni, pedane, scarti) sono immutabili: ogni modifica genera una riga in `audit_log`
- RLS attiva su tutte le tabelle

---

## Tabelle

### `prodotti_grezzi`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
created_by  uuid REFERENCES auth.users(id)
updated_at  timestamptz
updated_by  uuid REFERENCES auth.users(id)
nome        text NOT NULL
descrizione text
attivo      boolean DEFAULT true
```

### `varieta`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at          timestamptz DEFAULT now()
created_by          uuid REFERENCES auth.users(id)
updated_at          timestamptz
updated_by          uuid REFERENCES auth.users(id)
nome                text NOT NULL
descrizione         text
prodotto_grezzo_id  uuid NOT NULL REFERENCES prodotti_grezzi(id) ON DELETE CASCADE
attivo              boolean DEFAULT true
```

### `articoli`
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at                  timestamptz DEFAULT now()
created_by                  uuid REFERENCES auth.users(id)
updated_at                  timestamptz
updated_by                  uuid REFERENCES auth.users(id)
nome                        text NOT NULL
descrizione                 text
peso_per_collo              numeric NOT NULL         -- kg
peso_variabile              boolean DEFAULT false    -- se true: peso pedana sovrascrivibile
vincolo_prodotto_grezzo_id  uuid REFERENCES prodotti_grezzi(id)  -- nullable
vincolo_varieta_id          uuid REFERENCES varieta(id)          -- nullable
attivo                      boolean DEFAULT true
```

**Logica vincoli articolo:**
- Nessun vincolo → usabile con qualsiasi lotto
- Solo `vincolo_prodotto_grezzo_id` → usabile solo con lotti di quel prodotto grezzo
- `vincolo_varieta_id` → usabile solo con lotti di quella varietà (implica vincolo sul prodotto grezzo padre)

Il sistema filtra gli articoli disponibili all'apertura della lavorazione. Articoli incompatibili non compaiono — nessun messaggio di errore.

### `imballaggi_secondari`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
created_by  uuid REFERENCES auth.users(id)
updated_at  timestamptz
updated_by  uuid REFERENCES auth.users(id)
nome        text NOT NULL        -- es. "Cartone 40x60", "Bins", "Cassa di legno"
descrizione text
tara_kg     numeric              -- tara imballaggio in kg (per usi futuri)
lunghezza_cm numeric             -- lunghezza imballaggio
larghezza_cm numeric             -- larghezza imballaggio
altezza_cm   numeric             -- altezza imballaggio
attivo      boolean DEFAULT true
```

### `linee`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
created_by  uuid REFERENCES auth.users(id)
updated_at  timestamptz
updated_by  uuid REFERENCES auth.users(id)
nome        text NOT NULL
descrizione text
attiva      boolean DEFAULT true
ordine      integer              -- posizione nel cruscotto, configurabile da Admin
```

### `sigle_lotto`
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at          timestamptz DEFAULT now()
created_by          uuid REFERENCES auth.users(id)
updated_at          timestamptz
updated_by          uuid REFERENCES auth.users(id)
codice              text NOT NULL UNIQUE   -- es. "2012", inserito manualmente
produttore          text NOT NULL
prodotto_grezzo_id  uuid NOT NULL REFERENCES prodotti_grezzi(id)
varieta_id          uuid NOT NULL REFERENCES varieta(id)
campo               text                  -- identificativo campo/appezzamento
```

### `lotti_ingresso`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at      timestamptz DEFAULT now()
codice          text NOT NULL UNIQUE   -- formato SIGLA-DOY, es. "2012-012". Generato automaticamente.
sigla_lotto_id  uuid NOT NULL REFERENCES sigle_lotto(id)
data_ingresso   date NOT NULL
doy             integer NOT NULL       -- Day of Year, calcolato automaticamente da trigger
```

**Funzione DOY:**
```sql
CREATE OR REPLACE FUNCTION get_doy(d date) RETURNS integer AS $$
  SELECT EXTRACT(DOY FROM d)::integer;
$$ LANGUAGE sql IMMUTABLE;
```

**Trigger generazione `codice` e `doy`:**
```sql
CREATE OR REPLACE FUNCTION generate_lotto_ingresso_codice()
RETURNS TRIGGER AS $$
DECLARE
  sigla text;
  doy_val integer;
BEGIN
  SELECT codice INTO sigla FROM sigle_lotto WHERE id = NEW.sigla_lotto_id;
  doy_val := get_doy(NEW.data_ingresso);
  NEW.doy := doy_val;
  NEW.codice := sigla || '-' || LPAD(doy_val::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lotto_ingresso_codice
BEFORE INSERT ON lotti_ingresso
FOR EACH ROW EXECUTE FUNCTION generate_lotto_ingresso_codice();
```

### `lavorazioni`
```sql
id                        uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at                timestamptz DEFAULT now()
linea_id                  uuid NOT NULL REFERENCES linee(id)
lotto_ingresso_id         uuid NOT NULL REFERENCES lotti_ingresso(id)
articolo_id               uuid NOT NULL REFERENCES articoli(id)
imballaggio_secondario_id uuid NOT NULL REFERENCES imballaggi_secondari(id)
stato                     text NOT NULL CHECK (stato IN ('aperta','chiusa')) DEFAULT 'aperta'
aperta_at                 timestamptz NOT NULL DEFAULT now()
chiusa_at                 timestamptz          -- NULL = lavorazione aperta
aperta_da                 uuid NOT NULL REFERENCES auth.users(id)
```

> Su una stessa linea possono coesistere più lavorazioni aperte (caso eccezionale). Richiede conferma esplicita dell'Operatore. Vedi `DESIGN.md §Modali`.

### `pedane`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at      timestamptz DEFAULT now()
codice_pedana   text NOT NULL UNIQUE   -- formato PYY-DOY-NNNN, es. "P26-051-0042". Generato da trigger.
lavorazione_id  uuid NOT NULL REFERENCES lavorazioni(id)
numero_colli    integer NOT NULL
peso_totale     numeric NOT NULL       -- calcolato o sovrascritto dall'Operatore
registrata_at   timestamptz NOT NULL DEFAULT now()
registrata_da   uuid NOT NULL REFERENCES auth.users(id)
```

**Trigger generazione `codice_pedana`:**
```sql
CREATE OR REPLACE FUNCTION generate_codice_pedana()
RETURNS TRIGGER AS $$
DECLARE
  anno text;
  doy_val text;
  progressivo integer;
  oggi date := CURRENT_DATE;
BEGIN
  anno := TO_CHAR(oggi, 'YY');
  doy_val := LPAD(EXTRACT(DOY FROM oggi)::text, 3, '0');

  SELECT COUNT(*) + 1 INTO progressivo
  FROM pedane
  WHERE DATE(registrata_at) = oggi;

  NEW.codice_pedana := 'P' || anno || '-' || doy_val || '-' || LPAD(progressivo::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codice_pedana
BEFORE INSERT ON pedane
FOR EACH ROW EXECUTE FUNCTION generate_codice_pedana();
```

**Logica peso:**
- `articoli.peso_variabile = false` → `peso_totale = numero_colli × articoli.peso_per_collo` (calcolato lato app, non modificabile)
- `articoli.peso_variabile = true` → app propone la stima, Operatore può sovrascrivere. Avviso visivo se modificato. Vedi `DESIGN.md §Modal Registrazione Pedana`.

**Peso zero bloccato:** validazione lato app — `peso_totale = 0` non permesso.

### `scarti`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at        timestamptz DEFAULT now()
lotto_ingresso_id uuid NOT NULL REFERENCES lotti_ingresso(id)
colli             integer      -- numero contenitori scartati. Almeno uno tra colli e peso_kg obbligatorio.
peso_kg           numeric      -- peso totale scarto in kg. Almeno uno tra colli e peso_kg obbligatorio.
registrato_at     timestamptz NOT NULL DEFAULT now()
registrato_da     uuid NOT NULL REFERENCES auth.users(id)
```

**Formula % scarto per lotto ingresso:**
```sql
SELECT
  SUM(s.peso_kg) AS scarto_kg,
  SUM(p.peso_totale) AS prodotto_kg,
  ROUND(
    SUM(s.peso_kg) / NULLIF(SUM(p.peso_totale) + SUM(s.peso_kg), 0) * 100,
    2
  ) AS percentuale_scarto
FROM lotti_ingresso li
LEFT JOIN lavorazioni lav ON lav.lotto_ingresso_id = li.id
LEFT JOIN pedane p ON p.lavorazione_id = lav.id
LEFT JOIN scarti s ON s.lotto_ingresso_id = li.id
WHERE li.id = '<lotto_id>'
GROUP BY li.id;
```

I campi `colli` e `peso_kg` sono indipendenti — nessun calcolo automatico tra i due.

### `audit_log`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at        timestamptz DEFAULT now()
utente_id         uuid NOT NULL REFERENCES auth.users(id)
utente_nome       text NOT NULL        -- snapshot del nome al momento dell'azione (denormalizzato)
timestamp         timestamptz NOT NULL DEFAULT now()
tabella           text NOT NULL        -- es. 'lavorazioni', 'pedane', 'scarti', 'articoli'
record_id         uuid NOT NULL        -- ID del record coinvolto
azione            text NOT NULL        -- 'insert' | 'update' | 'delete_logic' | 'apertura' | 'chiusura' | 'riapertura'
campo             text                 -- nome del campo modificato (solo per azione 'update')
valore_precedente jsonb                -- stato prima della modifica
valore_nuovo      jsonb                -- stato dopo la modifica
motivo            text                 -- motivazione opzionale inserita dall'utente
```

**Regole immutabilità — enforce via RLS:**
- Solo `INSERT` permesso su `audit_log`, mai `UPDATE` o `DELETE`
- Copre tutte le tabelle: anagrafiche, lavorazioni, pedane, scarti
- Ogni INSERT, UPDATE e disattivazione (`attivo = false`) genera una riga
- Accessibile in lettura solo all'Admin

---

## Relazioni

```
prodotti_grezzi
  └── varieta (N:1)
        └── sigle_lotto (N:1 prodotto_grezzo + varieta)
              └── lotti_ingresso (N:1)
                    └── lavorazioni (N:1)
                          └── pedane (N:1)
                    └── scarti (N:1)

articoli
  ├── vincolo_prodotto_grezzo_id → prodotti_grezzi (nullable)
  └── vincolo_varieta_id → varieta (nullable)

lavorazioni
  ├── linea_id → linee
  ├── lotto_ingresso_id → lotti_ingresso
  ├── articolo_id → articoli
  └── imballaggio_secondario_id → imballaggi_secondari
```

---

## Indici

```sql
-- Query frequenti cruscotto
CREATE INDEX idx_lavorazioni_linea ON lavorazioni(linea_id);
CREATE INDEX idx_lavorazioni_stato ON lavorazioni(stato);
CREATE INDEX idx_lavorazioni_aperta_at ON lavorazioni(aperta_at);

-- Ricerca lotti
CREATE INDEX idx_lotti_ingresso_codice ON lotti_ingresso(codice);
CREATE INDEX idx_lotti_ingresso_data ON lotti_ingresso(data_ingresso);

-- Pedane per lavorazione e per giorno
CREATE INDEX idx_pedane_lavorazione ON pedane(lavorazione_id);
CREATE INDEX idx_pedane_data ON pedane(DATE(registrata_at));

-- Scarti per lotto
CREATE INDEX idx_scarti_lotto ON scarti(lotto_ingresso_id);

-- Audit log per record
CREATE INDEX idx_audit_log_record ON audit_log(tabella, record_id);
CREATE INDEX idx_audit_log_utente ON audit_log(utente_id);
```

---

## RLS Policies (Supabase)

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE prodotti_grezzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE varieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE articoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE imballaggi_secondari ENABLE ROW LEVEL SECURITY;
ALTER TABLE linee ENABLE ROW LEVEL SECURITY;
ALTER TABLE sigle_lotto ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotti_ingresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavorazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedane ENABLE ROW LEVEL SECURITY;
ALTER TABLE scarti ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: ruolo utente corrente
CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'viewer'
  );
$$ LANGUAGE sql STABLE;

-- Anagrafiche: Admin CRUD, Operatore e Viewer solo lettura
CREATE POLICY "anagrafiche_select" ON prodotti_grezzi
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "anagrafiche_write" ON prodotti_grezzi
  FOR ALL TO authenticated USING (auth_role() = 'admin');
-- (stessa logica per varieta, articoli, imballaggi_secondari, linee, sigle_lotto)

-- Lotti ingresso: tutti leggono, solo Admin inserisce
CREATE POLICY "lotti_ingresso_select" ON lotti_ingresso
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lotti_ingresso_insert" ON lotti_ingresso
  FOR INSERT TO authenticated WITH CHECK (auth_role() = 'admin');

-- Lavorazioni, pedane, scarti: Admin e Operatore CRUD, Viewer solo lettura
CREATE POLICY "produttivo_select" ON lavorazioni
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "produttivo_write" ON lavorazioni
  FOR ALL TO authenticated
  USING (auth_role() IN ('admin', 'operatore'))
  WITH CHECK (auth_role() IN ('admin', 'operatore'));
-- (stessa logica per pedane, scarti)

-- Audit log: tutti inseriscono, solo Admin legge, nessuno modifica/cancella
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated USING (auth_role() = 'admin');
```
