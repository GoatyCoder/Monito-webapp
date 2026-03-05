import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-4">
      {/* Intro pagina home placeholder. */}
      <h1 className="text-3xl font-bold">Monito Webapp</h1>
      <p className="text-secondary">Skeleton iniziale senza logica business.</p>

      {/* Navigazione di base verso le aree principali. */}
      <nav className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="rounded bg-primary px-4 py-2 text-white">
          Cruscotto
        </Link>
        <Link href="/report" className="rounded border border-secondary px-4 py-2 text-secondary">
          Report
        </Link>
        <Link href="/anagrafiche" className="rounded border border-secondary px-4 py-2 text-secondary">
          Anagrafiche
        </Link>
        <Link href="/settings" className="rounded border border-secondary px-4 py-2 text-secondary">
          Impostazioni
        </Link>
      </nav>
    </section>
  );
}
