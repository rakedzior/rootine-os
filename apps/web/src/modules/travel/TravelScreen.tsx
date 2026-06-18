import { useIsFeatureVisible } from '@/features/config/useConfig';
import '@/styles/travel.css';

const PIN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

/* Faithful port of Travel.html overview. Static demo content for layout;
 * CRUD (trips/docs/budget/packing) wired later. */
export function TravelScreen() {
  const showNext = useIsFeatureVisible('travel.next_trip');
  const showDocs = useIsFeatureVisible('travel.documents');
  const showBucket = useIsFeatureVisible('travel.bucket_list');

  return (
    <main className="travel">
      <div className="grid" id="overview">
        {/* LEFT */}
        <section className="col">
          {showNext && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">01</span><span className="card-title">Najbliższy wyjazd</span></div>
                <span className="pill accent"><span className="led" />wkrótce</span>
              </div>
              <div className="th-dest">Brak wyjazdu<span className="cc">—</span></div>
              <div className="th-sub">Dodaj wyjazd, by zobaczyć szczegóły</div>
              <div className="th-grid">
                <div className="th-cell"><div className="k">Wylot</div><div className="v">—</div></div>
                <div className="th-cell"><div className="k">Powrót</div><div className="v">—</div></div>
                <div className="th-cell"><div className="k">Lot</div><div className="v">—</div></div>
                <div className="th-cell"><div className="k">Nocleg</div><div className="v">—</div></div>
              </div>
              <button className="ov-btn" type="button">Dodaj wyjazd →</button>
            </article>
          )}

          {showDocs && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">02</span><span className="card-title">Dokumenty podróżne</span></div>
                <span className="pill">Sejf</span>
              </div>
              <div className="agenda-empty">Dodaj dokumenty podróżne (paszport, EKUZ, ubezpieczenie).</div>
            </article>
          )}
        </section>

        {/* CENTER */}
        <section className="col">
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">03</span><span className="card-title">Nadchodzące wyjazdy</span></div>
              <span className="pill">Najbliższy rok</span>
            </div>
            <div className="agenda-empty">Brak zaplanowanych wyjazdów.</div>
          </article>

          {showBucket && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">04</span><span className="card-title">Lista marzeń</span></div>
                <span className="pill">Kiedyś</span>
              </div>
              <div className="wish">
                <span className="pin">{PIN}</span>
                <div className="wi"><div className="n">Japonia · Tokio + Kioto</div><div className="t">Wiosna 2027</div></div>
                <span className="wtag hot">W planach</span>
              </div>
              <div className="wish">
                <span className="pin">{PIN}</span>
                <div className="wi"><div className="n">Islandia · ring road</div><div className="t">Autem dookoła wyspy · 10 dni</div></div>
                <span className="wtag">Marzenie</span>
              </div>
            </article>
          )}
        </section>

        {/* RIGHT */}
        <section className="col">
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">05</span><span className="card-title">Licznik podróży</span></div>
              <span className="pill">Statystyki</span>
            </div>
            <div className="tstat">
              <div className="cell"><div className="v">0</div><div className="k">Krajów</div></div>
              <div className="cell"><div className="v">0</div><div className="k">Miast</div></div>
              <div className="cell"><div className="v">0</div><div className="k">Kontynenty</div></div>
              <div className="cell"><div className="v">0</div><div className="k">Wyjazdów</div></div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
