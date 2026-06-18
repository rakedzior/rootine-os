import { useState } from 'react';
import '@/styles/desk.css';

type Sec = 'dashboard' | 'dokumenty' | 'umowy' | 'auto' | 'ubezpieczenia' | 'uop' | 'b2b' | 'urlopy';

const SECTIONS: { key: Sec; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'dokumenty', label: 'Dokumenty' },
  { key: 'umowy', label: 'Umowy' },
  { key: 'auto', label: 'Auto' },
  { key: 'ubezpieczenia', label: 'Ubezpieczenia' },
  { key: 'uop', label: 'UoP' },
  { key: 'b2b', label: 'B2B' },
  { key: 'urlopy', label: 'Urlopy' },
];

const CONTENT: Record<Sec, { title: string; body: string }[]> = {
  dashboard: [{ title: 'Przegląd', body: 'Najbliższe terminy: OC/AC, przeglądy, rozliczenia — pojawią się tutaj.' }],
  dokumenty: [{ title: 'Dokumenty i sejf', body: 'Prywatne dokumenty w Supabase Storage (signed URLs). CRUD wkrótce.' }],
  umowy: [{ title: 'Umowy', body: 'Umowy i kluczowe daty.' }],
  auto: [{ title: 'Auto: przegląd, OC/AC, serwis', body: 'Pojazdy, terminy przeglądów i polis, historia serwisu.' }],
  ubezpieczenia: [{ title: 'Ubezpieczenia', body: 'Polisy, sumy, terminy odnowienia.' }],
  uop: [{ title: 'Umowa o pracę', body: 'Szczegóły UoP i urlopy.' }],
  b2b: [{ title: 'Rozliczenia B2B / ZUS / PIT / VAT', body: 'Miesięczne rozliczenia i terminy.' }],
  urlopy: [{ title: 'Urlopy', body: 'Pula i wykorzystanie urlopu.' }],
};

export function BiuroScreen() {
  const [sec, setSec] = useState<Sec>('dashboard');
  return (
    <div className="app" style={{ minHeight: 'auto' }}>
      <div className="biuro-subnav">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`biuro-nav-btn${sec === s.key ? ' active' : ''}`}
            type="button"
            onClick={() => setSec(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 820 }}>
        <section className="col">
          {CONTENT[sec].map((c, i) => (
            <article className="card" key={i}>
              <div className="card-head">
                <div className="lhs"><span className="card-title">{c.title}</span></div>
                <span className="pill">Wkrótce</span>
              </div>
              <div className="agenda-empty">{c.body}</div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
