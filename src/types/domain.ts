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
  action:
    | 'insert'
    | 'update'
    | 'soft_delete'
    | 'restore'
    | 'open'
    | 'close'
    | 'reopen';
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};
