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
export type ProdottoGrezzo = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
  };

export type Varieta = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    prodottoGrezzoId: string;
  };

export type Articolo = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    pesoPerCollo: number;
    pesoVariabile: boolean;
    vincoloProdottoGrezzoId: string | null;
    vincoloVarietaId: string | null;
  };

export type ImballaggioSecondario = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    taraKg: number | null;
    lunghezzaCm: number | null;
    larghezzaCm: number | null;
    altezzaCm: number | null;
  };

export type Linea = EntityAuditFields &
  SoftDeletable & {
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
  siglaLottoId: string;
  dataIngresso: string;
  lottoIngresso: number;
  articoloId: string;
  imballaggioSecondarioId: string;
  pesoPerCollo: number;
  note: string | null;
  apertaAt: string | null;
  chiusaAt: string | null;
  apertaDa: string | null;
};

export type LavorazioneStato = 'programmata' | 'in_corso' | 'terminata';

export function getLavorazioneStato(l: Lavorazione): LavorazioneStato {
  if (!l.apertaAt) return 'programmata';
  if (!l.chiusaAt) return 'in_corso';
  return 'terminata';
}

/**
 * LOGICA PESO PEDANA (da implementare in futuro):
 *
 * pesoPerCollo della Lavorazione è il default per le pedane figlie.
 * Alla creazione di una Pedana l'operatore può:
 *   a) Inserire i colli → peso totale = colli × pesoPerCollo (calcolato, salvato)
 *   b) Inserire il peso totale direttamente → l'interfaccia mostra
 *      pesoPerCollo = pesoPedana / colli come informazione visiva (NON salvata)
 *
 * Sul DB la Pedana salva SOLO pesoPedana (totale).
 * Il campo pesoPerCollo della pedana NON viene persistito.
 */
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
  action:
    | 'insert'
    | 'update'
    | 'soft_delete'
    | 'restore'
    | 'delete'
    | 'open'
    | 'close'
    | 'reopen'
    | 'schedule';
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};
