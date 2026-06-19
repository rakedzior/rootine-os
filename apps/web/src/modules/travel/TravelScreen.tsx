import { useState } from 'react';
import {
  useTrips, useCreateTrip, usePatchTrip, useDeleteTrip,
  useTripItems, useAddTripItem, useDeleteTripItem,
  useTripDocuments, useAddTripDocument, useDeleteTripDocument,
  useBucketList, useAddBucketItem, usePatchBucketItem, useDeleteBucketItem,
  useTripBudget,
} from '@/features/travel/hooks';
import type { Trip, TripItemType } from '@/features/travel/types';
import '@/styles/travel.css';

const STATUS_LABELS: Record<string, string> = { planned: 'W planach', active: 'Aktywna', done: 'Zakończona' };
const STATUS_COLORS: Record<string, string> = { planned: 'var(--ev-blue)', active: 'var(--acc-a)', done: 'var(--ink-3)' };

type TripTab = 'plan' | 'flights' | 'hotels' | 'attractions' | 'packing' | 'budget' | 'docs' | 'notes';
const TRIP_TABS: { key: TripTab; label: string; itemType?: TripItemType }[] = [
  { key: 'plan', label: 'Plan' },
  { key: 'flights', label: 'Loty', itemType: 'flight' },
  { key: 'hotels', label: 'Hotele', itemType: 'lodging' },
  { key: 'attractions', label: 'Atrakcje', itemType: 'attraction' },
  { key: 'packing', label: 'Pakowanie', itemType: 'packing' },
  { key: 'budget', label: 'Budżet' },
  { key: 'docs', label: 'Dokumenty' },
  { key: 'notes', label: 'Notatki' },
];

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TravelScreen() {
  const tripsQ = useTrips();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [newDest, setNewDest] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newStatus, setNewStatus] = useState<'planned' | 'active' | 'done'>('planned');

  const trips = tripsQ.data ?? [];
  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;

  function addTrip() {
    if (!newDest.trim()) return;
    createTrip.mutate({
      dest: newDest.trim(),
      country: newCountry.trim() || null,
      start_date: newStart || null,
      end_date: newEnd || null,
      status: newStatus,
    });
    setNewDest(''); setNewCountry(''); setNewStart(''); setNewEnd(''); setNewStatus('planned');
    setShowAddTrip(false);
  }

  if (selectedTrip) {
    return (
      <TripDetail
        trip={selectedTrip}
        onBack={() => setSelectedTripId(null)}
      />
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Podróże</h2>
        <button type="button" className="btn-primary" onClick={() => setShowAddTrip(true)} style={{ padding: '8px 16px' }}>
          + Nowa podróż
        </button>
      </div>

      {/* Add trip form */}
      {showAddTrip && (
        <article className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <span className="card-title">Nowa podróż</span>
            <button type="button" onClick={() => setShowAddTrip(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-3)' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="bs-label">Cel podróży *</label>
              <input className="fi" placeholder="np. Tokio" value={newDest} onChange={(e) => setNewDest(e.target.value)} autoFocus style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label className="bs-label">Kraj / miejsce</label>
              <input className="fi" placeholder="Japonia" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label className="bs-label">Status</label>
              <select className="fi-sel" value={newStatus} onChange={(e) => setNewStatus(e.target.value as 'planned' | 'active' | 'done')} style={{ width: '100%' }}>
                <option value="planned">W planach</option>
                <option value="active">Aktywna</option>
                <option value="done">Zakończona</option>
              </select>
            </div>
            <div>
              <label className="bs-label">Data wyjazdu</label>
              <input className="fi" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label className="bs-label">Data powrotu</label>
              <input className="fi" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={addTrip} disabled={!newDest.trim() || createTrip.isPending} style={{ width: '100%', padding: 12 }}>
            {createTrip.isPending ? 'Tworzenie…' : 'Utwórz podróż'}
          </button>
        </article>
      )}

      {/* Trip list */}
      {tripsQ.isLoading && <div className="agenda-empty">Ładowanie…</div>}
      {!tripsQ.isLoading && trips.length === 0 && (
        <div className="agenda-empty" style={{ padding: 32, textAlign: 'center' }}>
          Brak podróży. Kliknij „+ Nowa podróż" aby dodać pierwszą.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onClick={() => setSelectedTripId(trip.id)}
            onDelete={() => deleteTrip.mutate(trip.id)}
          />
        ))}
      </div>

      {/* Bucket List */}
      <BucketListSection />
    </main>
  );
}

function TripCard({ trip, onClick, onDelete }: { trip: Trip; onClick: () => void; onDelete: () => void }) {
  const itemsQ = useTripItems(trip.id);
  const items = itemsQ.data ?? [];
  const daysToGo = trip.start_date
    ? Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <article
      className="card"
      style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{trip.dest}</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--mono)',
              background: STATUS_COLORS[trip.status] + '22',
              color: STATUS_COLORS[trip.status],
              fontWeight: 600,
            }}>
              {STATUS_LABELS[trip.status] ?? trip.status}
            </span>
          </div>
          {trip.country && (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>{trip.country}</div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)', flexWrap: 'wrap' }}>
            <span>📅 {fmt(trip.start_date)} → {fmt(trip.end_date)}</span>
            {daysToGo !== null && daysToGo > 0 && (
              <span style={{ color: 'var(--acc-a)', fontWeight: 600 }}>za {daysToGo} dni</span>
            )}
            {daysToGo !== null && daysToGo <= 0 && trip.status === 'active' && (
              <span style={{ color: 'var(--acc-a)', fontWeight: 600 }}>trwa</span>
            )}
            {items.length > 0 && (
              <span>{items.length} {items.length === 1 ? 'element' : 'elementów'}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 20, padding: '4px 4px', flexShrink: 0, lineHeight: 1 }}
          aria-label="Usuń podróż"
        >
          ×
        </button>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {['flight', 'lodging', 'attraction', 'packing'].map((type) => {
            const count = items.filter((i) => i.type === type).length;
            if (count === 0) return null;
            const icons: Record<string, string> = { flight: '✈️', lodging: '🏨', attraction: '📍', packing: '🎒' };
            return <span key={type} style={{ marginRight: 8 }}>{icons[type]} {count}</span>;
          })}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--acc-a)', fontWeight: 600 }}>
          Otwórz →
        </span>
      </div>
    </article>
  );
}

function TripDetail({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const patchTrip = usePatchTrip();
  const [tab, setTab] = useState<TripTab>('plan');

  const itemsQ = useTripItems(trip.id);
  const addItem = useAddTripItem();
  const delItem = useDeleteTripItem();

  const docsQ = useTripDocuments();
  const addDoc = useAddTripDocument();
  const delDoc = useDeleteTripDocument();

  const budgetQ = useTripBudget(trip.id);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocExp, setNewDocExp] = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(trip.notes ?? '');

  const items = itemsQ.data ?? [];
  const allDocs = docsQ.data ?? [];
  const tripDocs = allDocs.filter((d) => d.trip_id === trip.id);
  const budgetItems = budgetQ.data ?? [];

  const currentTab = TRIP_TABS.find((t) => t.key === tab)!;
  const tabItems = currentTab.itemType ? items.filter((i) => i.type === currentTab.itemType) : [];

  function addTabItem() {
    if (!newItemTitle.trim() || !currentTab.itemType) return;
    addItem.mutate({ trip_id: trip.id, type: currentTab.itemType, title: newItemTitle.trim() });
    setNewItemTitle('');
  }

  function addTripDoc() {
    if (!newDocName.trim()) return;
    addDoc.mutate({ trip_id: trip.id, name: newDocName.trim(), expires_on: newDocExp || null });
    setNewDocName(''); setNewDocExp('');
  }

  function saveNotes() {
    patchTrip.mutate({ id: trip.id, patch: { notes } });
    setEditNotes(false);
  }

  const totalPlanned = budgetItems.reduce((s, b) => s + b.planned, 0);
  const totalActual = budgetItems.reduce((s, b) => s + b.actual, 0);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 8px' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', fontSize: 20, padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{trip.dest}</h2>
          {trip.country && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{trip.country}</div>}
        </div>
        <select
          value={trip.status}
          onChange={(e) => patchTrip.mutate({ id: trip.id, patch: { status: e.target.value as Trip['status'] } })}
          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: STATUS_COLORS[trip.status], fontWeight: 600, cursor: 'pointer' }}
        >
          <option value="planned">W planach</option>
          <option value="active">Aktywna</option>
          <option value="done">Zakończona</option>
        </select>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
        {fmt(trip.start_date)} → {fmt(trip.end_date)}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
        {TRIP_TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              background: tab === t.key ? 'var(--acc-a)' : 'var(--surface-inset)',
              color: tab === t.key ? '#fff' : 'var(--ink-2)',
              transition: 'background .15s, color .15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Plan */}
      {tab === 'plan' && (
        <article className="card">
          <div className="card-head">
            <span className="card-title">Plan podróży</span>
            <button type="button" className="pill" onClick={() => setEditNotes(!editNotes)} style={{ cursor: 'pointer' }}>
              {editNotes ? 'Anuluj' : 'Edytuj'}
            </button>
          </div>
          {editNotes ? (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-inset)', color: 'var(--ink)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Wpisz plan, harmonogram, itinerarium…"
              />
              <button type="button" className="btn-primary" onClick={saveNotes} disabled={patchTrip.isPending} style={{ marginTop: 8, width: '100%' }}>
                {patchTrip.isPending ? 'Zapisywanie…' : 'Zapisz'}
              </button>
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: trip.notes ? 'var(--ink)' : 'var(--ink-3)', lineHeight: 1.6, minHeight: 60 }}>
              {trip.notes || 'Brak planu. Kliknij Edytuj aby dodać.'}
            </div>
          )}
        </article>
      )}

      {/* TAB: item lists (flights, hotels, attractions, packing) */}
      {currentTab.itemType && (
        <article className="card">
          <div className="card-head">
            <span className="card-title">{currentTab.label}</span>
            <span className="pill">{tabItems.length}</span>
          </div>
          {tabItems.length === 0 ? (
            <div className="agenda-empty">Brak wpisów. Dodaj poniżej.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {tabItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 8, fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    {item.datetime && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                        {new Date(item.datetime).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => delItem.mutate({ id: item.id, tripId: trip.id })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="fi" style={{ flex: 1 }} placeholder={`Dodaj ${currentTab.label.toLowerCase()}…`}
              value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTabItem()} />
            <button type="button" className="btn-primary" onClick={addTabItem} disabled={!newItemTitle.trim() || addItem.isPending}
              style={{ flexShrink: 0, padding: '8px 16px' }}>
              +
            </button>
          </div>
        </article>
      )}

      {/* TAB: Budget */}
      {tab === 'budget' && (
        <article className="card">
          <div className="card-head">
            <span className="card-title">Budżet</span>
            <span className="pill">{totalActual.toFixed(0)} / {totalPlanned.toFixed(0)} PLN</span>
          </div>
          {budgetItems.length === 0 ? (
            <div className="agenda-empty">Brak pozycji budżetowych.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 12px', fontSize: 13, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink-3)', fontSize: 11 }}>Kategoria</div>
                <div style={{ fontWeight: 600, color: 'var(--ink-3)', fontSize: 11 }}>Plan</div>
                <div style={{ fontWeight: 600, color: 'var(--ink-3)', fontSize: 11 }}>Faktycznie</div>
                {budgetItems.map((b) => (
                  <>
                    <div key={b.id + 'cat'}>{b.category}</div>
                    <div key={b.id + 'plan'} style={{ fontFamily: 'var(--mono)', textAlign: 'right' }}>{b.planned}</div>
                    <div key={b.id + 'act'} style={{ fontFamily: 'var(--mono)', textAlign: 'right', color: b.actual > b.planned ? 'var(--acc-b)' : 'var(--acc-a)' }}>{b.actual}</div>
                  </>
                ))}
                <div style={{ fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>Razem</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>{totalPlanned}</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'right', color: totalActual > totalPlanned ? 'var(--acc-b)' : 'var(--acc-a)', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>{totalActual}</div>
              </div>
            </>
          )}
          {budgetItems.length === 0 && (
            <div className="agenda-empty" style={{ marginTop: 8 }}>Budżet jest zarządzany przez bazę danych. Dodaj pozycje przez migrację lub bezpośrednio.</div>
          )}
        </article>
      )}

      {/* TAB: Dokumenty */}
      {tab === 'docs' && (
        <article className="card">
          <div className="card-head">
            <span className="card-title">Dokumenty</span>
            <span className="pill">{tripDocs.length}</span>
          </div>
          {tripDocs.length === 0 ? (
            <div className="agenda-empty">Brak dokumentów dla tej podróży.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {tripDocs.map((d) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 8, fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.name}</div>
                    {d.expires_on && <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)', marginTop: 2 }}>Wygasa: {fmt(d.expires_on)}</div>}
                  </div>
                  <button type="button" onClick={() => delDoc.mutate(d.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="fi" style={{ flex: 2, minWidth: 160 }} placeholder="Nazwa dokumentu…"
              value={newDocName} onChange={(e) => setNewDocName(e.target.value)} />
            <input className="fi" type="date" style={{ width: 140 }} value={newDocExp} onChange={(e) => setNewDocExp(e.target.value)} />
            <button type="button" className="btn-primary" onClick={addTripDoc} disabled={!newDocName.trim() || addDoc.isPending} style={{ flexShrink: 0, padding: '8px 16px' }}>
              +
            </button>
          </div>
        </article>
      )}

      {/* TAB: Notatki (post-trip notes) */}
      {tab === 'notes' && (
        <article className="card">
          <div className="card-head">
            <span className="card-title">Notatki po podróży</span>
          </div>
          <div className="agenda-empty">Sekcja na wspomnienia, koszty powypadkowe i przemyślenia. Edycja w zakładce Plan.</div>
        </article>
      )}
    </main>
  );
}

function BucketListSection() {
  const bucketQ = useBucketList();
  const addBucket = useAddBucketItem();
  const patchBucket = usePatchBucketItem();
  const deleteBucket = useDeleteBucketItem();
  const [newBucket, setNewBucket] = useState('');
  const [show, setShow] = useState(false);

  const bucket = bucketQ.data ?? [];
  const BUCKET_STATUS: Record<string, string> = { dream: '💭 Marzenie', planned: '📌 W planach', done: '✅ Zrobione' };

  return (
    <div style={{ marginTop: 32 }}>
      <button type="button" onClick={() => setShow((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        {show ? '▾' : '▸'} Lista marzeń ({bucket.length})
      </button>
      {show && (
        <article className="card" style={{ marginTop: 8 }}>
          {bucket.length === 0 ? (
            <div className="agenda-empty">Brak miejsc na liście marzeń.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {bucket.map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 8, fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{BUCKET_STATUS[b.status] ?? b.status}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select value={b.status}
                      onChange={(e) => patchBucket.mutate({ id: b.id, patch: { status: e.target.value as any } })}
                      style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
                      <option value="dream">Marzenie</option>
                      <option value="planned">W planach</option>
                      <option value="done">Zrobione</option>
                    </select>
                    <button type="button" onClick={() => deleteBucket.mutate(b.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="fi" style={{ flex: 1 }} placeholder="Dodaj miejsce marzeń…"
              value={newBucket} onChange={(e) => setNewBucket(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newBucket.trim()) { addBucket.mutate({ name: newBucket.trim() }); setNewBucket(''); } }} />
            <button type="button" className="btn-primary"
              onClick={() => { if (newBucket.trim()) { addBucket.mutate({ name: newBucket.trim() }); setNewBucket(''); } }}
              style={{ flexShrink: 0, padding: '8px 16px' }}>+</button>
          </div>
        </article>
      )}
    </div>
  );
}
