# AGENTS.md – Regole operative per agenti AI

**Progetto:** Monito  
**Destinatari:** Claude, Codex, Cursor e qualsiasi agente AI che contribuisce al repository

---

## 1. Lettura obbligatoria prima di ogni contributo

Nell'ordine:

1. `docs/PRD.md` — requisiti e comportamenti di sistema
2. `docs/Design.md` — design system e specifiche UI
3. `docs/Schema.md` — architettura DB, migration, tipi TypeScript
4. `docs/TODO.md` — stato avanzamento e codice da aggiungere

In caso di conflitto tra implementazione e documentazione: **privilegiare la documentazione** e proporre esplicitamente un aggiornamento.

---

## 2. Quando fermarsi e chiedere

- Comportamento non definito in `docs/PRD.md §Comportamenti di Sistema`
- Libreria non presente in `docs/PRD.md §Stack Tecnologico`
- Due implementazioni equivalenti senza criterio esplicito di scelta
- Conflitto tra file in `docs/` e codice esistente

---

## 3. Regole database

**Schema attivo** — mai hardcodare `ops_2025`. Usare sempre le costanti:

```typescript
import { OPS_SCHEMA, REGISTRY_SCHEMA, AUDIT_SCHEMA } from '@/lib/config/db';
```

**Client Supabase**
- Componenti client (`'use client'`): `createSupabaseClient()` da `src/lib/db/supabase-client.ts`
- Server Components e Route Handlers: `createSupabaseServerClient()` da `src/lib/db/supabase-server.ts`
- Mai istanziare `createClient` direttamente da `@supabase/supabase-js`
- La `service_role` key è riservata a migration server-side, mai lato client

**Soft delete** — mai `DELETE` fisico su `registry.*`:

```typescript
{ is_active: false, deleted_at: new Date().toISOString(), deleted_by: userId }
```

**Audit log** — ogni INSERT, UPDATE, soft_delete, restore, open, close, reopen produce una riga in `audit.log` tramite RPC (non usare `from('audit.log')`):

```typescript
await supabase.rpc('log_audit_event', {
  actor_id:    userId,
  actor_name:  userName,       // snapshot al momento dell'azione
  schema_name: OPS_SCHEMA,     // o REGISTRY_SCHEMA
  table_name:  'lavorazioni',
  record_id:   recordId,
  action:      'open',
  old_value:   null,
  new_value:   { ...record },
  reason:      reason ?? null
});
```

---

## 4. Regole codice

- TypeScript strict — nessun `any` esplicito, nessun `// @ts-ignore`
- Componenti: `PascalCase`. File: `kebab-case`. Cartelle: `lowercase`
- `src/components/` — componenti UI. `src/lib/` — logica business. `src/types/` — tipi. `src/lib/db/` — query DB
- Commenti: italiano. Variabili e funzioni: inglese
- Nessun CSS custom — solo classi Tailwind
- Nessuna libreria esterna senza aggiornamento di `docs/PRD.md §Stack Tecnologico`

---

## 5. Coerenza documentale

| Se cambia... | Aggiornare... |
|---|---|
| Requisito funzionale o comportamento | `docs/PRD.md` |
| UI/UX, componente, layout | `docs/Design.md` |
| Schema DB, RLS, tipi TypeScript | `docs/Schema.md` |
| Stato avanzamento, task, codice | `docs/TODO.md` |

Ogni PR deve indicare quali sezioni sono state rispettate o aggiornate.
