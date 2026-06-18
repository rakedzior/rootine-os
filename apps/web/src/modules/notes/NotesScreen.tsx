import { useIsFeatureVisible } from '@/features/config/useConfig';
import '@/styles/notes.css';

/* Faithful port of Notes.html layout (3-column). Static / empty-state; CRUD wired later. */
export function NotesScreen() {
  const showCapture = useIsFeatureVisible('notes.quick_capture');
  const showCollections = useIsFeatureVisible('notes.collections');
  const showJournal = useIsFeatureVisible('notes.journal');
  const showRecent = useIsFeatureVisible('notes.recent');

  return (
    <main className="grid">
      {/* LEFT */}
      <section className="col">
        {showCapture && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">01</span><span className="card-title">Szybki zapis</span></div>
              <span className="pill accent"><span className="led" />Szkic</span>
            </div>
            <textarea className="cap-area" placeholder="Zapisz myśl, listę, cokolwiek…" />
            <div className="cap-collrow">
              <span className="lbl">Do</span>
              <button className="cap-chip c-personal on" type="button">Osobiste</button>
              <button className="cap-chip c-work" type="button">Praca</button>
              <button className="cap-chip c-ideas" type="button">Pomysły</button>
            </div>
            <div className="cap-foot">
              <div className="seg">
                <button className="on" type="button">Notatka</button>
                <button type="button">Lista</button>
                <button type="button">Cytat</button>
              </div>
              <button className="cap-save" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
                Zapisz
              </button>
            </div>
          </article>
        )}

        {showCollections && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">02</span><span className="card-title">Kolekcje</span></div>
              <span className="pill">0 notatek</span>
            </div>
            <div>
              <div className="coll c-all on"><span className="dot" /><span className="n">Wszystkie notatki</span><span className="ct">0</span></div>
              <div className="coll c-personal"><span className="dot" /><span className="n">Osobiste</span><span className="ct">0</span></div>
              <div className="coll c-work"><span className="dot" /><span className="n">Praca</span><span className="ct">0</span></div>
              <div className="coll c-ideas"><span className="dot" /><span className="n">Pomysły</span><span className="ct">0</span></div>
              <div className="coll c-journal"><span className="dot" /><span className="n">Dziennik</span><span className="ct">0</span></div>
            </div>
          </article>
        )}
      </section>

      {/* CENTER */}
      <section className="col">
        <article className="card">
          <div className="card-head">
            <div className="lhs"><span className="idx">03</span><span className="card-title">Wszystkie notatki</span></div>
            <span className="pill">0 notatek</span>
          </div>
          <div className="nboard">
            <div className="agenda-empty">Brak notatek — zapisz pierwszą po lewej (CRUD wkrótce).</div>
          </div>
        </article>
      </section>

      {/* RIGHT */}
      <section className="col">
        {showJournal && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">04</span><span className="card-title">Dziennik dziś</span></div>
              <span className="pill">Dziś</span>
            </div>
            <div className="prompt">
              <div className="k">Pytanie dnia</div>
              <div className="q">Jaki jeden mały sukces z dziś warto zapamiętać?</div>
            </div>
            <div className="tmpl-btns">
              <button className="tmpl" type="button">
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg></span>
                <span className="tx"><span className="n">Wpis do dziennika</span><span className="d">Pisz swobodnie z pytaniem dnia</span></span>
              </button>
              <button className="tmpl" type="button">
                <span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C5 16 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 16 12 21z" /></svg></span>
                <span className="tx"><span className="n">3 wdzięczności</span><span className="d">Szablon listy</span></span>
              </button>
            </div>
          </article>
        )}

        {showRecent && (
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">05</span><span className="card-title">Ostatnio edytowane</span></div>
              <span className="pill">Ostatnie 5</span>
            </div>
            <div className="agenda-empty">Brak ostatnich wpisów.</div>
          </article>
        )}
      </section>
    </main>
  );
}
