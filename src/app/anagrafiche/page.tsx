export default function AnagrafichePage() {
  return (
    <section className="space-y-4">
      {/* Sezione amministrazione anagrafiche. */}
      <h1 className="text-2xl font-semibold">Anagrafiche</h1>
      <p className="text-secondary">Placeholder CRUD per linee, prodotti, varietà, articoli e sigle lotto.</p>

      {/* Elenco moduli anagrafici futuri. */}
      <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
        <li>Linee</li>
        <li>Prodotti grezzi e varietà</li>
        <li>Imballaggi secondari</li>
        <li>Articoli e vincoli</li>
        <li>Sigle lotto</li>
      </ul>
    </section>
  );
}
