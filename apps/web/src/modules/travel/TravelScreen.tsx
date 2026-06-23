import { useState } from 'react';
import { SubTabs, Modal, EmptyState, ConfirmDelete, Field, ProgressBar, IcoTrash } from '@/components/common';
import { useLocalStore, type Trip } from '@/store/localStore';

const TABS = [
  { id: 'podroze',   label: 'Podróże',   icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 'pakowanie', label: 'Pakowanie', icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { id: 'wishlist',  label: 'Wishlist',  icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function tripDays(t: Trip) {
  return Math.ceil((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000) + 1;
}

export function TravelScreen() {
  const [tab, setTab] = useState('podroze');
  return (
    <div className="module-page">
      <div className="module-header no-title">
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 'podroze'   && <TravelList />}
      {tab === 'pakowanie' && <TravelPacking />}
      {tab === 'wishlist'  && <TravelWishlist />}
    </div>
  );
}

// ─── PODRÓŻE ──────────────────────────────────────────────────

function TravelList() {
  const { trips, addTrip, deleteTrip } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(trips[0]?.id ?? null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Trip['status'] | 'all'>('all');

  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [budget, setBudget] = useState<number | undefined>();

  const statusLabels: Record<string, string> = { planned: 'Planowana', active: 'W trakcie', completed: 'Zakończona', archived: 'Archiwum' };
  const filtered = filter === 'all' ? trips.filter(t => t.status !== 'archived') : trips.filter(t => t.status === filter);
  const selected = trips.find(t => t.id === selectedId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Sidebar */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Podróże</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Nowa</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(['all','planned','active','completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: filter === f ? 'var(--green)' : 'var(--surface-3)', color: filter === f ? 'white' : 'var(--ink-2)' }}>
              {f === 'all' ? 'Wszystkie' : statusLabels[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0
          ? <EmptyState title="Brak podróży" cta="Zaplanuj podróż" onCta={() => setShowAdd(true)} />
          : filtered.map(trip => (
            <div key={trip.id}
              onClick={() => setSelectedId(trip.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }}>{trip.coverEmoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedId === trip.id ? 'var(--green-text)' : 'var(--ink)' }}>{trip.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtDate(trip.startDate)} · {tripDays(trip)} dni</div>
              </div>
              <span className={`badge ${trip.status === 'active' ? 'badge-green' : trip.status === 'planned' ? 'badge-gray' : 'badge-gray'}`} style={{ fontSize: 10 }}>{statusLabels[trip.status]}</span>
            </div>
          ))
        }
      </div>

      {/* Detail */}
      {selected ? (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 48 }}>{selected.coverEmoji}</span>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{selected.title}</h2>
                <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>{selected.country}{selected.city ? `, ${selected.city}` : ''}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                  {fmtDate(selected.startDate)} — {fmtDate(selected.endDate)} · {tripDays(selected)} dni
                </div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setDeleteId(selected.id)}><IcoTrash /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Status', val: statusLabels[selected.status] },
              { label: 'Budżet', val: selected.budget ? `${selected.budget.toLocaleString('pl-PL')} PLN` : 'Nie ustawiony' },
              { label: 'Długość', val: `${tripDays(selected)} nocy` },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{item.val}</div>
              </div>
            ))}
          </div>

          {selected.notes && <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{selected.notes}</p>}
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <EmptyState title="Wybierz podróż" desc="Kliknij podróż po lewej, aby zobaczyć szczegóły." />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nowa podróż"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!title.trim() || !startDate || !endDate) return;
            addTrip({ title, country, city: city || undefined, startDate, endDate, status: 'planned', coverEmoji: emoji, notes: '', budget, isArchived: false });
            setTitle(''); setCountry(''); setCity(''); setStartDate(''); setEndDate(''); setBudget(undefined); setShowAdd(false);
          }}>Zapisz</button>
        </>}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Emoji"><input className="input" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: 60, textAlign: 'center', fontSize: 22 }} /></Field>
          <Field label="Nazwa podróży" required><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Np. Bali — wakacje" style={{ width: '100%' }} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Kraj"><input className="input" value={country} onChange={e => setCountry(e.target.value)} placeholder="Indonezja" /></Field>
          <Field label="Miasto"><input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Denpasar (opcjonalnie)" /></Field>
          <Field label="Data wyjazdu" required><input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} /></Field>
          <Field label="Data powrotu" required><input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} /></Field>
          <Field label="Budżet (PLN)"><input type="number" className="input" value={budget ?? ''} onChange={e => setBudget(e.target.value ? +e.target.value : undefined)} placeholder="Opcjonalnie" /></Field>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteTrip(deleteId!); setSelectedId(null); setDeleteId(null); }} label="tę podróż" />
    </div>
  );
}

// ─── PAKOWANIE ────────────────────────────────────────────────

function TravelPacking() {
  const { packingTemplates } = useLocalStore();
  const [selectedId, setSelectedId] = useState<string | null>(packingTemplates[0]?.id ?? null);
  const selected = packingTemplates.find(t => t.id === selectedId);

  const grouped: Record<string, { id: string; name: string; category: string; quantity: number; packed: boolean }[]> = {};
  selected?.items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const packedCount = selected?.items.filter(i => i.packed).length ?? 0;
  const totalCount = selected?.items.length ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <div className="card-head"><span className="card-title">Szablony</span></div>
        {packingTemplates.map(t => (
          <div key={t.id} onClick={() => setSelectedId(t.id)}
            style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', color: selectedId === t.id ? 'var(--green-text)' : 'var(--ink)' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{t.items.length} elementów</div>
          </div>
        ))}
        {packingTemplates.length === 0 && <EmptyState title="Brak szablonów" />}
      </div>

      {selected ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.name}</h2>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-text)' }}>{packedCount}/{totalCount} spakowane</span>
          </div>
          <ProgressBar value={packedCount} max={totalCount} size="md" />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>{cat}</div>
                {items.map((item: { id: string; name: string; category: string; quantity: number; packed: boolean }) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${item.packed ? 'var(--green-mid)' : 'var(--border)'}`, background: item.packed ? 'var(--green-mid)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', flexShrink: 0, cursor: 'pointer' }}>
                      {item.packed && '✓'}
                    </div>
                    <span style={{ fontSize: 13, flex: 1, textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? 'var(--ink-3)' : 'var(--ink)' }}>{item.name}</span>
                    {item.quantity > 1 && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>×{item.quantity}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <EmptyState title="Wybierz szablon" />
        </div>
      )}
    </div>
  );
}

// ─── WISHLIST ─────────────────────────────────────────────────

function TravelWishlist() {
  const { wishlist, addWishlistPlace } = useLocalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [priority, setPriority] = useState(3);

  const unvisited = wishlist.filter(w => !w.visited);
  const visited = wishlist.filter(w => w.visited);

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Dodaj miejsce</button>
      </div>

      {unvisited.length > 0 && (
        <div className="card">
          <div className="card-head"><span className="card-title">🗺 Chcę odwiedzić ({unvisited.length})</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {unvisited.sort((a,b) => b.priority - a.priority).map(place => (
              <div key={place.id} style={{ background: 'var(--surface-3)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{place.country}</div>
                {place.city && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{place.city}</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ fontSize: 14, color: i < place.priority ? 'var(--p-mid)' : 'var(--border)' }}>★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visited.length > 0 && (
        <div className="card">
          <div className="card-head"><span className="card-title">✅ Odwiedzone ({visited.length})</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visited.map(place => (
              <span key={place.id} style={{ padding: '6px 14px', background: 'var(--green-soft2)', color: 'var(--green-text)', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
                {place.city ? `${place.city}, ` : ''}{place.country}
              </span>
            ))}
          </div>
        </div>
      )}

      {unvisited.length === 0 && visited.length === 0 && (
        <div className="card"><EmptyState title="Pusta lista życzeń" desc="Dodaj miejsca, które chcesz odwiedzić." cta="Dodaj miejsce" onCta={() => setShowAdd(true)} /></div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Dodaj miejsce"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Anuluj</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (!country.trim()) return;
            addWishlistPlace({ country, city: city || undefined, priority, notes: '', visited: false });
            setCountry(''); setCity(''); setPriority(3); setShowAdd(false);
          }}>Dodaj</button>
        </>}>
        <Field label="Kraj"><input className="input" value={country} onChange={e => setCountry(e.target.value)} autoFocus /></Field>
        <Field label="Miasto (opcjonalnie)"><input className="input" value={city} onChange={e => setCity(e.target.value)} /></Field>
        <Field label="Priorytet (1–10)"><input type="number" min={1} max={10} className="input" value={priority} onChange={e => setPriority(+e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
