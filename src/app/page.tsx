'use client';

import dynamic from 'next/dynamic';

const TacticalCanvas = dynamic(() => import('../components/TacticalCanvas'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <header className="w-full max-w-7xl flex justify-between items-center py-4">
        <h1 className="text-xl font-bold">Tableau Tactique PWA</h1>
        <span className="text-sm text-neutral-400">Match en cours</span>
      </header>

      <section className="w-full max-w-7xl flex flex-col items-center">
        <TacticalCanvas />
      </section>
    </main>
  );
}