import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useTrips, useCreateTrip, useDeleteTrip, usePatchTrip,
  useTripItems, useAddTripItem, useDeleteTripItem,
  useTripDocuments, useAddTripDocument, useDeleteTripDocument,
  useBucketList, useAddBucketItem, usePatchBucketItem, useDeleteBucketItem,
} from '@/features/travel/hooks';
import '@/styles/travel.css';

const PIN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

const STATUS_LABEL: Record<string, string> = { dream: 'Marzenie', planned: 'W planach', done: 'Zrobione' };

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff;
}

export function TravelScreen() {
  const showNext = useIsFeatureVisible('travel.next_trip');
  const showDocs = useIsFeatureVisible('travel.documents');
  const showBucket = useIsFeatureVisible('travel.bucket_list');
  const showPacking = useIsFeatureVisible('travel.packing');
  const showBudget = useIsFeatureVisible('travel.budget');
  const showAttractions = useIsFeatureVisible('travel.attractions');

  const tripsQ = useTrips();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();
  const patchTrip = usePatchTrip();

  const [newDest, setNewDest] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [showAddTrip, setShowAddTrip] = useState(false);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const itemsQ = useTripItems(selectedTripId);
  const addItem = useAddTripItem();
  const delItem = useDeleteTripItem();
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<'flight' | 'lodging' | 'transport' | 'attraction' | 'packing'>('attraction');

  const docsQ = useTripDocuments();
  const addDoc = useAddTripDocument();
  const delDoc = useDeleteTripDocument();
  const [newDocName, setNewDocName] = useState('');
  const [newDocExp, setNewDocExp] = useState('');

  const bucketQ = useBucketList();
  const addBucket = useAddBucketItem();
  const patchBucket = usePatchBucketItem();
  const deleteBucket = useDeleteBucketItem();
  const [newBucket, setNewBucket] = useState('');

  const trips = tripsQ.data ?? [];
  const today = new Date().toISOString().split('T')[0];
  const upcomingTrips = trips.filter((t) => !t.end_date || t.end_date >= today).sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
  const nextTrip = upcomingTrips[0] ?? null;

  const docs = docsQ.data ?? [];
  const bucket = bucketQ.data ?? [];
  const items = itemsQ.data ?? [];
  const packingItems = items.filter((i) => i.type === 'packing');
  const attractionItems = items.filter((i) => i.type === 'attraction');

  function addTrip() {
    if (!newDest.trim()) return;
    createTrip.mutate({ dest: newDest.trim(), country: newCountry || null, start_date: newStart || null, end_date: newEnd || null });
    setNewDest(''); setNewCountry(''); setNewStart(''); setNewEnd(''); setShowAddTrip(false);
  }

  function addTripItem() {
    if (!newItemTitle.trim()) return;
    addItem.mutate({ trip_id: selectedTripId, type: newItemType, title: newItemTitle.trim() });
    setNewItemTitle('');
  }

  function addDocument() {
    if (!newDocName.trim()) return;
    addDoc.mutate({ name: newDocName.trim(), expires_on: newDocExp || null });
    setNewDocName(''); setNewDocExp('');
  }

  const totalCountries = new Set(trips.map((t) => t.country).filter(Boolean)).size;

  return (
    <main className="travel">
      <div className="grid" id="overview">
        {/* LEFT */}
        <section className="col">
          {showNext && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">01</span><span className="card-title">Najbliższy wyjazd</span></div>
                {nextTrip && <span className="pill accent"><span className="led" />{nextTrip.status}</span>}
              </div>
              {nextTrip ? (
                <>
                  <div className="th-dest">{nextTrip.dest}<span className="cc">{nextTrip.country ? ` · ${nextTrip.country}` : ''}</span></div>
                  <div className="th-sub">
                    {daysUntil(nextTrip.start_date) != null
                      ? daysUntil(nextTrip.start_date)! > 0
                        ? `Za ${daysUntil(nextTrip.start_date)} dni`
                        : daysUntil(nextTrip.start_date)! === 0
                        ? 'Dziś!'
                        : 'W trakcie'
                      : 'Data nieustalona'}
                  </div>
                  <div className="th-grid">
                    <div className="th-cell"><div className="k">Wylot</div><div className="v">{fmt(nextTrip.start_date)}</div></div>
                    <div className="th-cell"><div className="k">Powrót</div><div className="v">{fmt(nextTrip.end_date)}</div></div>
                    <div className="th-cell"><div className="k">Status</div><div className="v">{nextTrip.status}</div></div>
                    <div className="th-cell"><div className="k">Kraj</div><div className="v">{nextTrip.country ?? '—'}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="ov-btn" type="button" onClick={() => setSelectedTripId(nextTrip.id === selectedTripId ? null : nextTrip.id)}>
                      {selectedTripId === nextTrip.id ? 'Odznacz' : 'Zarządzaj →'}
                    </button>
                    <button type="button" onClick={() => deleteTrip.mutate(nextTrip.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 12 }}>Usuń</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="th-dest" style={{ color: 'var(--ink-3)' }}>Brak wyjazdów</div>
                  <button className="ov-btn" type="button" onClick={() => setShowAddTrip(true)}>Dodaj wyjazd →</button>
                </>
              )}
              {showAddTrip && (
                <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                  <input className="fi" type="text" placeholder="Destynacja*" value={newDest} onChange={(e) => setNewDest(e.target.value)} />
                  <input className="fi" type="text" placeholder="Kraj" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="fi" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} style={{ flex: 1 }} />
                    <input className="fi" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="add-btn" type="button" onClick={addTrip}>Zapisz</button>
                    <button type="button" onClick={() => setShowAddTrip(false)} style={{ background: 'var(--surface-inset)', border: 'none', borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer' }}>Anuluj</button>
                  </div>
                </div>
              )}
            </article>
          )}

          {showDocs && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">02</span><span className="card-title">Dokumenty podróżne</span></div>
                <span className="pill">{docs.length}</span>
              </div>
              {docs.length === 0 ? (
                <div className="agenda-empty">Dodaj dokumenty (paszport, EKUZ, ubezpieczenie).</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {docs.map((d) => (
                    <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                        {d.expires_on && <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>wygasa {fmt(d.expires_on)}</span>}
                      </div>
                      <button type="button" onClick={() => delDoc.mutate(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="fi" type="text" placeholder="Nazwa dokumentu" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} style={{ flex: 1 }} />
                <input className="fi" type="date" value={newDocExp} onChange={(e) => setNewDocExp(e.target.value)} style={{ width: 130 }} />
                <button className="add-btn" type="button" onClick={addDocument}>+</button>
              </div>
            </article>
          )}
        </section>

        {/* CENTER */}
        <section className="col">
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">03</span><span className="card-title">Nadchodzące wyjazdy</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="pill">{upcomingTrips.length}</span>
                <button type="button" onClick={() => setShowAddTrip(true)} style={{ background: 'var(--surface-inset)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>+ Dodaj</button>
              </div>
            </div>
            {upcomingTrips.length === 0 ? (
              <div className="agenda-empty">Brak zaplanowanych wyjazdów.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingTrips.map((t) => (
                  <li key={t.id} style={{ padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', cursor: 'pointer', border: selectedTripId === t.id ? '1px solid var(--acc-a)' : '1px solid transparent' }}
                    onClick={() => setSelectedTripId(selectedTripId === t.id ? null : t.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{t.dest}</span>
                      <span style={{ fontSize: 11, padding: '2px 6px', background: 'var(--surface)', borderRadius: 3 }}>{t.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{fmt(t.start_date)} — {fmt(t.end_date)}</div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {selectedTripId && showAttractions && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">04</span><span className="card-title">Plan wyjazdu</span></div>
                <select className="fi-sel" value={newItemType} onChange={(e) => setNewItemType(e.target.value as typeof newItemType)} style={{ fontSize: 12, padding: '2px 6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                  <option value="attraction">Atrakcja</option>
                  <option value="flight">Lot</option>
                  <option value="lodging">Nocleg</option>
                  <option value="transport">Transport</option>
                  <option value="packing">Pakowanie</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input className="fi" type="text" placeholder="Tytuł" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && addTripItem()} />
                <button className="add-btn" type="button" onClick={addTripItem}>+</button>
              </div>
              {attractionItems.length === 0 ? (
                <div className="agenda-empty">Brak atrakcji — dodaj plan.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {attractionItems.map((i) => (
                    <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span>{i.title}</span>
                      <button type="button" onClick={() => delItem.mutate({ id: i.id, tripId: i.trip_id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}

          {showBucket && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">05</span><span className="card-title">Lista marzeń</span></div>
                <span className="pill">{bucket.length}</span>
              </div>
              {bucket.length === 0 ? (
                <div className="agenda-empty">Dodaj pierwsze miejsce na liście marzeń.</div>
              ) : (
                bucket.map((b) => (
                  <div key={b.id} className="wish">
                    <span className="pin">{PIN}</span>
                    <div className="wi"><div className="n">{b.name}</div>{b.note && <div className="t">{b.note}</div>}</div>
                    <span className="wtag" style={{ cursor: 'pointer' }} onClick={() => patchBucket.mutate({ id: b.id, patch: { status: b.status === 'dream' ? 'planned' : b.status === 'planned' ? 'done' : 'dream' } })}>
                      {STATUS_LABEL[b.status]}
                    </span>
                    <button type="button" onClick={() => deleteBucket.mutate(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', marginLeft: 4 }}>×</button>
                  </div>
                ))
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input className="fi" type="text" placeholder="Miejsce marzenie…" value={newBucket} onChange={(e) => setNewBucket(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter' && newBucket.trim()) { addBucket.mutate({ name: newBucket.trim() }); setNewBucket(''); } }} />
                <button className="add-btn" type="button" onClick={() => { if (newBucket.trim()) { addBucket.mutate({ name: newBucket.trim() }); setNewBucket(''); } }}>+</button>
              </div>
            </article>
          )}
        </section>

        {/* RIGHT */}
        <section className="col">
          <article className="card">
            <div className="card-head">
              <div className="lhs"><span className="idx">06</span><span className="card-title">Licznik podróży</span></div>
              <span className="pill">Statystyki</span>
            </div>
            <div className="tstat">
              <div className="cell"><div className="v">{totalCountries}</div><div className="k">Krajów</div></div>
              <div className="cell"><div className="v">{trips.length}</div><div className="k">Wyjazdów</div></div>
              <div className="cell"><div className="v">{trips.filter((t) => t.status === 'done').length}</div><div className="k">Zrobionych</div></div>
              <div className="cell"><div className="v">{bucket.filter((b) => b.status !== 'done').length}</div><div className="k">Na liście marzeń</div></div>
            </div>
          </article>

          {selectedTripId && showPacking && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="idx">07</span><span className="card-title">Lista pakowania</span></div>
                <span className="pill">{packingItems.length}</span>
              </div>
              {packingItems.length === 0 ? (
                <div className="agenda-empty">Dodaj rzeczy do spakowania.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {packingItems.map((i) => (
                    <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span>{i.title}</span>
                      <button type="button" onClick={() => delItem.mutate({ id: i.id, tripId: i.trip_id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="fi" type="text" placeholder="Dodaj do bagażu…" style={{ flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { addItem.mutate({ trip_id: selectedTripId, type: 'packing', title: (e.target as HTMLInputElement).value.trim() }); (e.target as HTMLInputElement).value = ''; } }} />
                <button className="add-btn" type="button" onClick={(e) => {
                  const inp = (e.currentTarget.previousSibling as HTMLInputElement);
                  if (inp?.value.trim()) { addItem.mutate({ trip_id: selectedTripId, type: 'packing', title: inp.value.trim() }); inp.value = ''; }
                }}>+</button>
              </div>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
