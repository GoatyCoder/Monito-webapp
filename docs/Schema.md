# Schema.md – Database e Tipi
**Progetto:** Monito  
**Riferimenti:** `PRD.md`, `Design.md`

---

## Architettura

Un singolo progetto Supabase con tre schemi applicativi:

| Schema | Contenuto | Mutabilità |
|---|---|---|
| `registry` | Anagrafiche: linee, prodotti, varietà, articoli, imballaggi, sigle lotto | Soft delete + hard delete Admin (con conferma applicativa) |
| `ops_YYYY` | Dati operativi dell'anno: lavorazioni, pedane, scarti | Append + audit, mai DELETE fisico |
| `audit` | Audit log immutabile | Solo INSERT |

Lo schema operativo attivo è `OPS_SCHEMA` in `src/lib/config/db.ts` — aggiornare ogni 1 gennaio.

---

## Convenzioni comuni

Tutte le tabelle applicative (eccetto `audit.log`) hanno:
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at timestamptz DEFAULT now()
created_by uuid NOT NULL REFERENCES auth.users(id)
updated_at timestamptz
updated_by uuid REFERENCES auth.users(id)
```

Le anagrafiche in `registry` hanno inoltre:
```sql
is_active  boolean NOT NULL DEFAULT true
deleted_at timestamptz
deleted_by uuid REFERENCES auth.users(id)
```

**Soft delete cascata:** il soft delete non è una funzionalità nativa del DB. In Monito viene applicato via logica applicativa con propagazione sulle anagrafiche collegate (es. `prodotti_grezzi` → `varieta`, `sigle_lotto`, `articoli` vincolati; `varieta` → `sigle_lotto`, `articoli` vincolati).

---

## Schema `registry`

### `registry.prodotti_grezzi`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
created_by  uuid NOT NULL REFERENCES auth.users(id)
updated_at  timestamptz
updated_by  uuid REFERENCES auth.users(id)
nome        text NOT NULL
descrizione text
is_active   boolean NOT NULL DEFAULT true
deleted_at  timestamptz
deleted_by  uuid REFERENCES auth.users(id)
```

### `registry.varieta`
```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at         timestamptz DEFAULT now()
created_by         uuid NOT NULL REFERENCES auth.users(id)
updated_at         timestamptz
updated_by         uuid REFERENCES auth.users(id)
nome               text NOT NULL
descrizione        text
prodotto_grezzo_id uuid NOT NULL REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE
is_active          boolean NOT NULL DEFAULT true
deleted_at         timestamptz
deleted_by         uuid REFERENCES auth.users(id)
```

### `registry.articoli`
```sql
id                         uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at                 timestamptz DEFAULT now()
created_by                 uuid NOT NULL REFERENCES auth.users(id)
updated_at                 timestamptz
updated_by                 uuid REFERENCES auth.users(id)
nome                       text NOT NULL
descrizione                text
peso_per_collo             numeric NOT NULL
peso_variabile             boolean DEFAULT false
vincolo_prodotto_grezzo_id uuid REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE
vincolo_varieta_id         uuid REFERENCES registry.varieta(id) ON DELETE CASCADE
is_active                  boolean NOT NULL DEFAULT true
deleted_at                 timestamptz
deleted_by                 uuid REFERENCES auth.users(id)
```

**Logica vincoli:**
- Nessun vincolo → usabile con qualsiasi lotto
- Solo `vincolo_prodotto_grezzo_id` → usabile solo con lotti di quel prodotto grezzo
- `vincolo_varieta_id` → usabile solo con lotti di quella varietà (implica vincolo sul prodotto grezzo padre)

Articoli incompatibili non compaiono nel dropdown — nessun messaggio di errore.

### `registry.imballaggi_secondari`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at   timestamptz DEFAULT now()
created_by   uuid NOT NULL REFERENCES auth.users(id)
updated_at   timestamptz
updated_by   uuid REFERENCES auth.users(id)
nome         text NOT NULL
descrizione  text
tara_kg      numeric
lunghezza_cm numeric
larghezza_cm numeric
altezza_cm   numeric
is_active    boolean NOT NULL DEFAULT true
deleted_at   timestamptz
deleted_by   uuid REFERENCES auth.users(id)
```

### `registry.linee`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
created_by  uuid NOT NULL REFERENCES auth.users(id)
updated_at  timestamptz
updated_by  uuid REFERENCES auth.users(id)
nome        text NOT NULL
descrizione text
is_active   boolean NOT NULL DEFAULT true
deleted_at  timestamptz
deleted_by  uuid REFERENCES auth.users(id)
ordine      integer
```

### `registry.sigle_lotto`
```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at         timestamptz DEFAULT now()
created_by         uuid NOT NULL REFERENCES auth.users(id)
updated_at         timestamptz
updated_by         uuid REFERENCES auth.users(id)
codice             text NOT NULL UNIQUE
produttore         text NOT NULL
prodotto_grezzo_id uuid NOT NULL REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE
varieta_id         uuid NOT NULL REFERENCES registry.varieta(id) ON DELETE CASCADE
campo              text
```

---

## Schema `ops_YYYY`

Le tabelle esistono in ogni schema annuale (`ops_2025`, `ops_2026`, …).  
I riferimenti a `registry.*` funzionano cross-schema — stesso database Supabase.

### `ops_YYYY.lavorazioni`
```sql
CREATE TABLE ops_YYYY.lavorazioni (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                uuid NOT NULL REFERENCES auth.users(id),
  linea_id                  uuid NOT NULL REFERENCES registry.linee(id),
  sigla_lotto_id            uuid NOT NULL REFERENCES registry.sigle_lotto(id),
  data_ingresso             date NOT NULL,
  lotto_ingresso            integer NOT NULL
                              CHECK (lotto_ingresso BETWEEN 1 AND 366),
  articolo_id               uuid NOT NULL REFERENCES registry.articoli(id),
  imballaggio_secondario_id uuid NOT NULL REFERENCES registry.imballaggi_secondari(id),
  peso_per_collo  numeric(8,3) NOT NULL
                              CHECK (peso_per_collo >= 0),
  note                      text,
  aperta_at                 timestamptz,
  chiusa_at                 timestamptz,
  aperta_da                 uuid REFERENCES auth.users(id),
  created_at                timestamptz NOT NULL DEFAULT now(),

  -- chiusa_at non può esistere se aperta_at è null
  CONSTRAINT lavorazioni_chiusa_requires_aperta
    CHECK (chiusa_at IS NULL OR aperta_at IS NOT NULL),

  -- chiusa_at deve essere >= aperta_at
  CONSTRAINT lavorazioni_chiusa_after_aperta
    CHECK (chiusa_at IS NULL OR chiusa_at >= aperta_at)
);
```

**Nota semantica:** `created_at/created_by` sono metadata tecnici. `aperta_at/aperta_da` sono il dominio operativo — mantenuti separati per tracciare correttamente le riaperture.

Su una stessa linea possono coesistere più lavorazioni aperte (caso eccezionale, richiede conferma esplicita). Vedi `PRD.md §Comportamenti di Sistema`.

### `ops_YYYY.pedane`
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at     timestamptz DEFAULT now()
created_by     uuid NOT NULL REFERENCES auth.users(id)
updated_at     timestamptz
updated_by     uuid REFERENCES auth.users(id)
codice_pedana  text NOT NULL UNIQUE
lavorazione_id uuid NOT NULL REFERENCES ops_YYYY.lavorazioni(id) ON DELETE CASCADE
numero_colli   integer NOT NULL
peso_totale    numeric NOT NULL
registrata_at  timestamptz NOT NULL DEFAULT now()
registrata_da  uuid NOT NULL REFERENCES auth.users(id)
```

**Formato `codice_pedana`:** `PYY-DOY-NNNN` (es. `P26-051-0042`). Generato da trigger DB.

Per evitare race condition su inserimenti concorrenti, il progressivo giornaliero non va calcolato con `COUNT(*) + 1`: usare una tabella contatore dedicata (`ops_YYYY.pedane_daily_counter`) aggiornata in modo atomico con `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`.

**Logica peso:**
- `peso_variabile = false` → `peso_totale = numero_colli × peso_per_collo`, calcolato lato app, non modificabile
- `peso_variabile = true` → app propone la stima, operatore può sovrascrivere con avviso visivo
- `peso_totale = 0` bloccato lato app

### `ops_YYYY.scarti`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at    timestamptz DEFAULT now()
created_by    uuid NOT NULL REFERENCES auth.users(id)
updated_at    timestamptz
updated_by    uuid REFERENCES auth.users(id)
sigla_lotto   text NOT NULL REFERENCES registry.sigle_lotto(codice) ON DELETE CASCADE
data_ingresso date NOT NULL
colli         integer
peso_kg       numeric
registrato_at timestamptz NOT NULL DEFAULT now()
registrato_da uuid NOT NULL REFERENCES auth.users(id)
```

Almeno uno tra `colli` e `peso_kg` obbligatorio (validazione lato app). I due campi sono indipendenti.

**Formula % scarto per lotto:**
```sql
WITH prodotto AS (
  SELECT COALESCE(SUM(p.peso_totale), 0) AS prodotto_kg
  FROM ops_YYYY.lavorazioni lav
  LEFT JOIN ops_YYYY.pedane p ON p.lavorazione_id = lav.id
  WHERE lav.sigla_lotto = :sigla AND lav.data_ingresso = :data
),
scarto AS (
  SELECT COALESCE(SUM(s.peso_kg), 0) AS scarto_kg
  FROM ops_YYYY.scarti s
  WHERE s.sigla_lotto = :sigla AND s.data_ingresso = :data
)
SELECT
  scarto.scarto_kg,
  prodotto.prodotto_kg,
  ROUND(
    scarto.scarto_kg / NULLIF(prodotto.prodotto_kg + scarto.scarto_kg, 0) * 100, 2
  ) AS percentuale_scarto
FROM prodotto CROSS JOIN scarto;
```

---

## Schema `audit`

### `audit.log`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_at    timestamptz NOT NULL DEFAULT now()
actor_id    uuid NOT NULL REFERENCES auth.users(id)
actor_name  text NOT NULL
schema_name text NOT NULL
table_name  text NOT NULL
record_id   uuid NOT NULL
action      text NOT NULL CHECK (action IN ('insert','update','soft_delete','restore','delete','open','close','reopen'))
field_name  text
old_value   jsonb
new_value   jsonb
reason      text
```

**Regole:** solo INSERT permesso (enforced via RLS). Nessun `updated_*`, nessun soft delete. L'azione `delete` traccia eliminazioni fisiche definitive. `actor_name` è denormalizzato — snapshot al momento dell'azione. Accessibile in lettura solo all'Admin.

---

## Relazioni
```
registry.prodotti_grezzi
  └── registry.varieta
        └── registry.sigle_lotto
              ├── ops_YYYY.lavorazioni
              │     └── ops_YYYY.pedane
              └── ops_YYYY.scarti

registry.articoli
  ├── vincolo_prodotto_grezzo_id → registry.prodotti_grezzi (nullable)
  └── vincolo_varieta_id         → registry.varieta (nullable)

ops_YYYY.lavorazioni
  ├── linea_id                  → registry.linee
  ├── sigla_lotto               → registry.sigle_lotto(codice)
  ├── articolo_id               → registry.articoli
  └── imballaggio_secondario_id → registry.imballaggi_secondari
```

---

## Tipi TypeScript

File: `src/types/domain.ts`
```typescript
export type UserRole = 'admin' | 'operatore' | 'viewer';

export type EntityAuditFields = {
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SoftDeletable = {
  isActive: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
};

// registry
export type ProdottoGrezzo = EntityAuditFields & SoftDeletable & {
  id: string;
  nome: string;
  descrizione: string | null;
};

export type Varieta = EntityAuditFields & SoftDeletable & {
  id: string;
  nome: string;
  descrizione: string | null;
  prodottoGrezzoId: string;
};

export type Articolo = EntityAuditFields & SoftDeletable & {
  id: string;
  nome: string;
  descrizione: string | null;
  pesoPerCollo: number;
  pesoVariabile: boolean;
  vincoloProdottoGrezzoId: string | null;
  vincoloVarietaId: string | null;
};

export type ImballaggioSecondario = EntityAuditFields & SoftDeletable & {
  id: string;
  nome: string;
  descrizione: string | null;
  taraKg: number | null;
  lunghezzaCm: number | null;
  larghezzaCm: number | null;
  altezzaCm: number | null;
};

export type Linea = EntityAuditFields & SoftDeletable & {
  id: string;
  nome: string;
  descrizione: string | null;
  ordine: number | null;
};

export type SiglaLotto = EntityAuditFields & {
  id: string;
  codice: string;
  produttore: string;
  prodottoGrezzoId: string;
  varietaId: string;
  campo: string | null;
};

// ops_YYYY
export type Lavorazione = EntityAuditFields & {
  id: string;
  lineaId: string;
  siglaLotto: string;
  dataIngresso: string;
  articoloId: string;
  imballaggioSecondarioId: string;
  stato: 'aperta' | 'chiusa';
  apertaAt: string;
  chiusaAt: string | null;
  apertaDa: string;
};

export type Pedana = EntityAuditFields & {
  id: string;
  codicePedana: string;
  lavorazioneId: string;
  numeroColli: number;
  pesoTotale: number;
  registrataDa: string;
};

export type Scarto = EntityAuditFields & {
  id: string;
  siglaLotto: string;
  dataIngresso: string;
  colli: number | null;
  pesoKg: number | null;
  registratoDa: string;
};

// audit
export type AuditLog = {
  id: string;
  eventAt: string;
  actorId: string;
  actorName: string;
  schemaName: string;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'soft_delete' | 'restore' | 'delete' | 'open' | 'close' | 'reopen';
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};
```

---

## Migration SQL

Eseguire su **Supabase → SQL Editor** nell'ordine indicato.

### Patch — Refactor lavorazioni
```sql
-- Refactor lavorazioni: rimozione campo stato e sigla_lotto (snapshot),
-- aggiunta sigla_lotto_id (FK), peso_per_collo, note,
-- aperta_at/chiusa_at diventano nullable, aggiunta constraints temporali.
--
-- ATTENZIONE: eseguire solo su DB con tabella vuota o dopo aver
-- verificato che non esistano righe con chiusa_at valorizzato e aperta_at NULL.

ALTER TABLE ops_2026.lavorazioni
  DROP COLUMN IF EXISTS stato,
  DROP COLUMN IF EXISTS sigla_lotto,
  ADD COLUMN  sigla_lotto_id            uuid
                NOT NULL REFERENCES registry.sigle_lotto(id),
  ADD COLUMN  peso_per_collo  numeric(8,3)
                NOT NULL DEFAULT 0 CHECK (peso_per_collo >= 0),
  ADD COLUMN  note                      text,
  ALTER COLUMN aperta_at  DROP NOT NULL,
  ALTER COLUMN chiusa_at  DROP NOT NULL,
  ADD CONSTRAINT lavorazioni_chiusa_requires_aperta
    CHECK (chiusa_at IS NULL OR aperta_at IS NOT NULL),
  ADD CONSTRAINT lavorazioni_chiusa_after_aperta
    CHECK (chiusa_at IS NULL OR chiusa_at >= aperta_at);
```


### Blocco 1 — Schema registry
```sql
CREATE SCHEMA registry;

CREATE TABLE registry.prodotti_grezzi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  nome        text NOT NULL,
  descrizione text,
  is_active   boolean NOT NULL DEFAULT true,
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id)
);

CREATE TABLE registry.varieta (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz DEFAULT now(),
  created_by         uuid NOT NULL REFERENCES auth.users(id),
  updated_at         timestamptz,
  updated_by         uuid REFERENCES auth.users(id),
  nome               text NOT NULL,
  descrizione        text,
  prodotto_grezzo_id uuid NOT NULL REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE,
  is_active          boolean NOT NULL DEFAULT true,
  deleted_at         timestamptz,
  deleted_by         uuid REFERENCES auth.users(id)
);

CREATE TABLE registry.articoli (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                 timestamptz DEFAULT now(),
  created_by                 uuid NOT NULL REFERENCES auth.users(id),
  updated_at                 timestamptz,
  updated_by                 uuid REFERENCES auth.users(id),
  nome                       text NOT NULL,
  descrizione                text,
  peso_per_collo             numeric NOT NULL,
  peso_variabile             boolean DEFAULT false,
  vincolo_prodotto_grezzo_id uuid REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE,
  vincolo_varieta_id         uuid REFERENCES registry.varieta(id) ON DELETE CASCADE,
  is_active                  boolean NOT NULL DEFAULT true,
  deleted_at                 timestamptz,
  deleted_by                 uuid REFERENCES auth.users(id)
);

CREATE TABLE registry.imballaggi_secondari (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  created_by   uuid NOT NULL REFERENCES auth.users(id),
  updated_at   timestamptz,
  updated_by   uuid REFERENCES auth.users(id),
  nome         text NOT NULL,
  descrizione  text,
  tara_kg      numeric,
  lunghezza_cm numeric,
  larghezza_cm numeric,
  altezza_cm   numeric,
  is_active    boolean NOT NULL DEFAULT true,
  deleted_at   timestamptz,
  deleted_by   uuid REFERENCES auth.users(id)
);

CREATE TABLE registry.linee (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz,
  updated_by  uuid REFERENCES auth.users(id),
  nome        text NOT NULL,
  descrizione text,
  is_active   boolean NOT NULL DEFAULT true,
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id),
  ordine      integer
);

CREATE TABLE registry.sigle_lotto (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz DEFAULT now(),
  created_by         uuid NOT NULL REFERENCES auth.users(id),
  updated_at         timestamptz,
  updated_by         uuid REFERENCES auth.users(id),
  codice             text NOT NULL UNIQUE,
  produttore         text NOT NULL,
  prodotto_grezzo_id uuid NOT NULL REFERENCES registry.prodotti_grezzi(id) ON DELETE CASCADE,
  varieta_id         uuid NOT NULL REFERENCES registry.varieta(id) ON DELETE CASCADE,
  campo              text
);
```

### Blocco 2 — Schema ops_2026

> Ripetere ogni 1 gennaio sostituendo `ops_2026` con `ops_YYYY`.
```sql
CREATE SCHEMA ops_2026;

CREATE TABLE ops_2026.lavorazioni (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                uuid NOT NULL REFERENCES auth.users(id),
  linea_id                  uuid NOT NULL REFERENCES registry.linee(id),
  sigla_lotto_id            uuid NOT NULL REFERENCES registry.sigle_lotto(id),
  data_ingresso             date NOT NULL,
  lotto_ingresso            integer NOT NULL
                              CHECK (lotto_ingresso BETWEEN 1 AND 366),
  articolo_id               uuid NOT NULL REFERENCES registry.articoli(id),
  imballaggio_secondario_id uuid NOT NULL REFERENCES registry.imballaggi_secondari(id),
  peso_per_collo  numeric(8,3) NOT NULL
                              CHECK (peso_per_collo >= 0),
  note                      text,
  aperta_at                 timestamptz,
  chiusa_at                 timestamptz,
  aperta_da                 uuid REFERENCES auth.users(id),
  created_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lavorazioni_chiusa_requires_aperta
    CHECK (chiusa_at IS NULL OR aperta_at IS NOT NULL),
  CONSTRAINT lavorazioni_chiusa_after_aperta
    CHECK (chiusa_at IS NULL OR chiusa_at >= aperta_at)
);

CREATE TABLE ops_2026.pedane (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz DEFAULT now(),
  created_by     uuid NOT NULL REFERENCES auth.users(id),
  updated_at     timestamptz,
  updated_by     uuid REFERENCES auth.users(id),
  codice_pedana  text NOT NULL UNIQUE,
  lavorazione_id uuid NOT NULL REFERENCES ops_2026.lavorazioni(id) ON DELETE CASCADE,
  numero_colli   integer NOT NULL,
  peso_totale    numeric NOT NULL,
  registrata_at  timestamptz NOT NULL DEFAULT now(),
  registrata_da  uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE ops_2026.pedane_daily_counter (
  day        date PRIMARY KEY DEFAULT CURRENT_DATE,
  last_value integer NOT NULL
);

CREATE TABLE ops_2026.scarti (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  updated_at    timestamptz,
  updated_by    uuid REFERENCES auth.users(id),
  sigla_lotto   text NOT NULL REFERENCES registry.sigle_lotto(codice) ON DELETE CASCADE,
  data_ingresso date NOT NULL,
  colli         integer,
  peso_kg       numeric,
  registrato_at timestamptz NOT NULL DEFAULT now(),
  registrato_da uuid NOT NULL REFERENCES auth.users(id)
);
```

### Blocco 3 — Trigger codice_pedana

> Ripetere ogni anno aggiornando lo schema.
```sql
CREATE OR REPLACE FUNCTION ops_2026.generate_codice_pedana()
RETURNS TRIGGER AS $$
DECLARE
  anno        text;
  doy_val     text;
  progressivo integer;
  oggi        date := CURRENT_DATE;
BEGIN
  anno    := TO_CHAR(oggi, 'YY');
  doy_val := LPAD(EXTRACT(DOY FROM oggi)::text, 3, '0');

  INSERT INTO ops_2026.pedane_daily_counter (day, last_value)
  VALUES (oggi, 1)
  ON CONFLICT (day) DO UPDATE
  SET last_value = ops_2026.pedane_daily_counter.last_value + 1
  RETURNING last_value INTO progressivo;

  NEW.codice_pedana := 'P' || anno || '-' || doy_val || '-' || LPAD(progressivo::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codice_pedana
BEFORE INSERT ON ops_2026.pedane
FOR EACH ROW EXECUTE FUNCTION ops_2026.generate_codice_pedana();
```

> Questa implementazione elimina la race condition del calcolo progressivo e mantiene l'univocità anche con inserimenti concorrenti.

### Blocco 4 — Schema audit
```sql
CREATE SCHEMA audit;

CREATE TABLE audit.log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_at    timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid NOT NULL REFERENCES auth.users(id),
  actor_name  text NOT NULL,
  schema_name text NOT NULL,
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  action      text NOT NULL CHECK (action IN ('insert','update','soft_delete','restore','delete','open','close','reopen')),
  field_name  text,
  old_value   jsonb,
  new_value   jsonb,
  reason      text
);
```

### Blocco 5 — Indici
```sql
CREATE INDEX idx_lav_linea    ON ops_2026.lavorazioni(linea_id);
CREATE INDEX idx_lav_at       ON ops_2026.lavorazioni(aperta_at);
CREATE INDEX idx_lav_lotto    ON ops_2026.lavorazioni(sigla_lotto_id, data_ingresso);
CREATE INDEX idx_ped_lav      ON ops_2026.pedane(lavorazione_id);
CREATE INDEX idx_ped_reg_at   ON ops_2026.pedane(registrata_at);
CREATE INDEX idx_sca_lotto    ON ops_2026.scarti(sigla_lotto, data_ingresso);
CREATE INDEX idx_audit_record ON audit.log(schema_name, table_name, record_id);
CREATE INDEX idx_audit_actor  ON audit.log(actor_id);
```

> Nota: evitare indici su espressioni derivate da `timestamptz` (es. `registrata_at::date` / `DATE(registrata_at)`) perché possono fallire con `ERROR: functions in index expression must be marked IMMUTABLE`. Per i filtri giornalieri usare range su `registrata_at` (es. `registrata_at >= :day AND registrata_at < :day + INTERVAL '1 day'`).

### Blocco 6 — Funzione ruolo e RLS
```sql
CREATE OR REPLACE FUNCTION public.auth_role() RETURNS text AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'viewer');
$$ LANGUAGE sql STABLE;

ALTER TABLE registry.prodotti_grezzi      ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.varieta              ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.articoli             ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.imballaggi_secondari ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.linee                ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.sigle_lotto          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'registry.prodotti_grezzi','registry.varieta','registry.articoli',
    'registry.imballaggi_secondari','registry.linee','registry.sigle_lotto'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "select" ON %s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "write"  ON %s FOR ALL    TO authenticated
      USING (public.auth_role() = ''admin'')
      WITH CHECK (public.auth_role() = ''admin'')', t);
  END LOOP;
END $$;

ALTER TABLE ops_2026.lavorazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_2026.pedane      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_2026.scarti      ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ops_2026.lavorazioni','ops_2026.pedane','ops_2026.scarti']
  LOOP
    EXECUTE format('CREATE POLICY "select" ON %s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "write"  ON %s FOR ALL    TO authenticated
      USING (public.auth_role() IN (''admin'',''operatore''))
      WITH CHECK (public.auth_role() IN (''admin'',''operatore''))', t);
  END LOOP;
END $$;

ALTER TABLE audit.log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert" ON audit.log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "select" ON audit.log FOR SELECT TO authenticated USING (public.auth_role() = 'admin');
```


### Blocco 7 — Grants per schemi non-public

> Senza questi grant, le query client possono fallire con `permission denied for schema ...` anche se le policy RLS sono corrette.
```sql
GRANT USAGE ON SCHEMA registry TO authenticated;
GRANT USAGE ON SCHEMA ops_2026 TO authenticated;
GRANT USAGE ON SCHEMA audit TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ops_2026 TO authenticated;
GRANT SELECT, INSERT ON TABLE audit.log TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA registry
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA ops_2026
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA audit
GRANT SELECT, INSERT ON TABLES TO authenticated;
```

Se il progetto esiste già e hai introdotto l'hard delete dopo la prima migrazione, riesegui i `GRANT ... DELETE` sopra per riallineare i permessi correnti.

In Supabase: **Project Settings → API → Exposed schemas** deve includere almeno `registry`, `ops_2026` e `audit`.

---

## Utenti

Creare da **Supabase → Authentication → Users → Add user**, poi assegnare il ruolo:
```sql
-- admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@azienda.it';

-- operatore
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "operatore"}'::jsonb
WHERE email = 'operatore@azienda.it';

-- viewer (default se ruolo assente, ma meglio esplicitarlo)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "viewer"}'::jsonb
WHERE email = 'viewer@azienda.it';
```

---

## Manutenzione annuale (ogni 1 gennaio)

| # | Dove | Azione |
|---|---|---|
| 1 | Supabase SQL Editor | Blocco 2 con nuovo `ops_YYYY` |
| 2 | Supabase SQL Editor | Blocco 3 con nuovo `ops_YYYY` |
| 3 | Supabase SQL Editor | Blocco 5 indici con nuovo `ops_YYYY` |
| 4 | Supabase SQL Editor | Blocco 6 RLS per nuovo `ops_YYYY` |
| 5 | Supabase SQL Editor | Blocco 7 Grants per nuovo `ops_YYYY` |
| 6 | Supabase Replication | Aggiungi toggle per 3 tabelle nuovo anno |
| 7 | Supabase API | Aggiorna *Exposed schemas* includendo nuovo `ops_YYYY` |
| 8 | GitHub | Aggiorna `OPS_SCHEMA` in `src/lib/config/db.ts`, committa su `main` |
| 9 | Vercel | Verifica redeploy |
| 10 | Supabase Replication | Disattiva toggle anno precedente (opzionale) |
