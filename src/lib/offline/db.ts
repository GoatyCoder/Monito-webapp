/*
  Storage offline placeholder (Dexie / IndexedDB).
  TODO:
  - Definire schema tabelle locali (lavorazioni/pedane/scarti in coda)
  - Implementare queue sync e stato conflitti
  - Esporre helper per enqueue/dequeue eventi
*/

export type OfflineStoreStatus = 'disabled' | 'pending-setup';

export const offlineStoreStatus: OfflineStoreStatus = 'pending-setup';
