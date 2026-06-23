import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, IcoTrash } from '@/components/common';
import { useLocalStore, type Trip, type WishlistPlace } from '@/store/localStore';
import '@/styles/travel.css';

type TravelIconName =
  | 'plane' | 'suitcase' | 'globe' | 'wallet' | 'calendar' | 'plus' | 'filter' | 'more'
  | 'hotel' | 'bus' | 'check' | 'map' | 'pin' | 'cloud' | 'document' | 'shield'
  | 'info' | 'trash' | 'archive' | 'spark' | 'route' | 'card';

type TravelStatusFilter = Trip['status'] | 'all';

const STATUS_LABELS: Record<Trip['status'], string> = {
  planned: 'Planowana',
  active: 'W trakcie',
  completed: 'Zakończona',
  archived: 'Archiwum',
};

const FILTER_LABELS: Record<TravelStatusFilter, string> = {
  all: 'Wszystkie',
  planned: 'Planowane',
  active: 'W trakcie',
  completed: 'Zakończone',
  archived: 'Archiwum',
};

const PACKING_ITEMS = [
  { id: 'passport', label: 'Paszport', packed: true },
  { id: 'charger', label: 'Ładowarka + kabel', packed: true },
  { id: 'sunglasses', label: 'Okulary przeciwsłoneczne', packed: true },
  { id: 'spf', label: 'Krem SPF 50', packed: true },
  { id: 'adapter', label: 'Adapter do gniazdek', packed: false },
  { id: 'meds', label: 'Leki podstawowe', packed: false },
  { id: 'powerbank', label: 'Powerbank', packed: false },
  { id: 'esim', label: 'Karta eSIM', packed: false },
];

function fmtDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
}

function fmtPLN(value: number) {
  return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000) + 1);
}

function daysUntil(date: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / 86400000);
}

function addDays(date: string, delta: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function statusClass(status: Trip['status']) {
  if (status === 'active') return 'is-active';
  if (status === 'completed') return 'is-complete';
  if (status === 'archived') return 'is-archived';
  return 'is-planned';
}

function locationLabel(trip: Trip) {
  return trip.city ? `${trip.city}, ${trip.country}` : trip.country;
}

function visualForTrip(trip?: Trip | null) {
  const source = `${trip?.title ?? ''} ${trip?.country ?? ''} ${trip?.city ?? ''}`.toLowerCase();
  if (source.includes('bali') || source.includes('indonez')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80';
  if (source.includes('rzym') || source.includes('włoch') || source.includes('wloch') || source.includes('rome')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80';
  if (source.includes('tokio') || source.includes('japon') || source.includes('tokyo')) return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80';
  if (source.includes('island')) return 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=900&q=80';
  if (source.includes('barcelona')) return 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80';
  if (source.includes('nowy jork') || source.includes('york')) return 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=900&q=80';
  return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
}

function tripAccent(trip: Trip, index: number) {
  const palette = ['pink', 'blue', 'violet', 'teal', 'clay'];
  const source = trip.status === 'completed' ? 'teal' : trip.status === 'active' ? 'blue' : palette[index % palette.length];
  return source;
}

function pickNextTrip(trips: Trip[]) {
  const upcoming = trips
    .filter((trip) => trip.status !== 'archived' && trip.status !== 'completed')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? trips.find((trip) => trip.status !== 'archived') ?? null;
}

function buildDeadlines(trip: Trip | null) {
  if (!trip) return [];
  return [
    { id: 'flight-out', date: trip.startDate, title: `Wylot do ${trip.city || trip.country}`, meta: 'Linia lotnicza i odprawa' },
    { id: 'check-in', date: trip.startDate, title: 'Zameldowanie', meta: 'Potwierdzenie noclegu' },
    { id: 'mid-route', date: addDays(trip.startDate, Math.min(7, Math.max(1, daysBetween(trip.startDate, trip.endDate) - 2))), title: 'Przejazd lokalny', meta: 'Transport między bazami' },
    { id: 'return', date: trip.endDate, title: 'Powrót do domu', meta: 'Lot lub przejazd powrotny' },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

function buildBudget(trip: Trip | null) {
  const total = trip?.budget ?? 0;
  const fallback = total || 8500;
  const rows = [
    { label: 'Loty', amount: Math.round(fallback * 0.3), tone: 'pink' },
    { label: 'Noclegi', amount: Math.round(fallback * 0.42), tone: 'violet' },
    { label: 'Transport', amount: Math.round(fallback * 0.11), tone: 'blue' },
    { label: 'Jedzenie', amount: Math.round(fallback * 0.16), tone: 'teal' },
    { label: 'Atrakcje', amount: Math.round(fallback * 0.09), tone: 'clay' },
  ];
  return { total, reserved: Math.round(fallback * 0.34), rows };
}

function buildLodgings(trip: Trip | null) {
  const city = trip?.city || trip?.country || 'Miejsce';
  return [
    { name: `Central ${city} Stay`, place: city, dates: `${fmtShortDate(trip?.startDate ?? '2026-07-13')} - ${fmtShortDate(addDays(trip?.startDate ?? '2026-07-13', 7))}`, price: 3200, link: 'Booking' },
    { name: `Druga baza - ${city}`, place: city, dates: `${fmtShortDate(addDays(trip?.startDate ?? '2026-07-13', 7))} - ${fmtShortDate(trip?.endDate ?? '2026-08-05')}`, price: 4100, link: 'Airbnb' },
  ];
}

function buildTransport(trip: Trip | null) {
  const place = trip?.city || trip?.country || 'cel podróży';
  return [
    { type: 'Lot', route: `Warszawa -> ${place}`, date: fmtShortDate(trip?.startDate ?? '2026-07-13'), carrier: 'Qatar Airways', price: 2850 },
    { type: 'Taxi', route: `Lotnisko -> ${place}`, date: fmtShortDate(trip?.startDate ?? '2026-07-13'), carrier: 'Grab', price: 140 },
    { type: 'Przejazd', route: `${place} -> druga baza`, date: fmtShortDate(addDays(trip?.startDate ?? '2026-07-13', 7)), carrier: 'Lokalny przewoźnik', price: 220 },
    { type: 'Powrót', route: `${place} -> Warszawa`, date: fmtShortDate(trip?.endDate ?? '2026-08-05'), carrier: 'Qatar Airways', price: 2850 },
  ];
}

export function TravelScreen() {
  const { trips, wishlist, addTrip, deleteTrip } = useLocalStore();
  const [selectedId, setSelectedId] = useState<string | null>(pickNextTrip(trips)?.id ?? null);
  const [filter, setFilter] = useState<TravelStatusFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [packingState, setPackingState] = useState<Record<string, boolean>>({});

  const visibleTrips = useMemo(() => {
    const base = filter === 'all'
      ? trips.filter((trip) => trip.status !== 'archived')
      : trips.filter((trip) => trip.status === filter);
    return [...base].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filter, trips]);

  const selected = trips.find((trip) => trip.id === selectedId) ?? visibleTrips[0] ?? pickNextTrip(trips);
  const activeTrips = trips.filter((trip) => trip.status !== 'archived');
  const plannedTrips = activeTrips.filter((trip) => trip.status === 'planned' || trip.status === 'active');
  const countriesCount = new Set(activeTrips.map((trip) => `${trip.country}-${trip.city ?? ''}`)).size;
  const totalBudget = activeTrips.reduce((sum, trip) => sum + (trip.budget ?? 0), 0);
  const nextTrip = pickNextTrip(trips);

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
    if (selectedId && !trips.some((trip) => trip.id === selectedId)) setSelectedId(pickNextTrip(trips)?.id ?? null);
  }, [selectedId, selected, trips]);

  function togglePacking(id: string, fallback: boolean) {
    setPackingState((state) => ({ ...state, [id]: !(state[id] ?? fallback) }));
  }

  return (
    <div className="module-page travel-page">
      <header className="travel-hero">
        <div className="travel-title-block">
          <span className="travel-hero-icon"><TravelIcon name="plane" /></span>
          <div>
            <h1>Podróże</h1>
            <p>Wszystkie wyjazdy i szczegóły podróży w jednym miejscu.</p>
          </div>
        </div>
        <div className="travel-actions">
          <button className="btn btn-primary" type="button" onClick={() => setShowAdd(true)}>
            <TravelIcon name="plus" /> Nowa podróż
          </button>
          <label className="travel-filter">
            <TravelIcon name="filter" />
            <select value={filter} onChange={(event) => setFilter(event.target.value as TravelStatusFilter)}>
              {(Object.keys(FILTER_LABELS) as TravelStatusFilter[]).map((key) => (
                <option key={key} value={key}>{FILTER_LABELS[key]}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="travel-kpis">
        <TravelKpi icon="suitcase" label="Planowane podróże" value={String(plannedTrips.length)} note="+ 50% względem poprzedniego miesiąca" tone="pink" />
        <TravelKpi icon="plane" label="Najbliższy wyjazd" value={nextTrip ? locationLabel(nextTrip) : 'Brak planów'} note={nextTrip ? fmtDate(nextTrip.startDate) : 'Dodaj pierwszy termin'} tone="blue" badge={nextTrip ? `za ${Math.max(0, daysUntil(nextTrip.startDate))} dni` : undefined} />
        <TravelKpi icon="globe" label="Kraje / miasta" value={String(countriesCount)} note={`${wishlist.filter((place) => !place.visited).length} na wishliście`} tone="violet" />
        <TravelKpi icon="wallet" label="Łączny budżet podróży" value={fmtPLN(totalBudget || 0)} note="vs. poprzedni miesiąc" tone="teal" />
      </section>

      <section className="travel-layout">
        <TripsRail
          trips={visibleTrips}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          onAdd={() => setShowAdd(true)}
        />

        {selected ? (
          <TripCentral
            trip={selected}
            packingState={packingState}
            onTogglePacking={togglePacking}
            onDelete={() => setDeleteId(selected.id)}
          />
        ) : (
          <div className="travel-card travel-empty-detail">
            <EmptyState title="Brak podróży" desc="Dodaj wyjazd, żeby zbudować plan." cta="Nowa podróż" onCta={() => setShowAdd(true)} />
          </div>
        )}

        <TravelAside trip={selected ?? null} wishlist={wishlist} />
      </section>

      <TripModal open={showAdd} onClose={() => setShowAdd(false)} onSave={(payload) => {
        addTrip(payload);
        setShowAdd(false);
      }} />
      <ConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTrip(deleteId);
          setDeleteId(null);
          setSelectedId(null);
        }}
        label="tę podróż"
      />
    </div>
  );
}

function TravelKpi({ icon, label, value, note, tone, badge }: { icon: TravelIconName; label: string; value: string; note: string; tone: string; badge?: string }) {
  return (
    <article className={`travel-kpi travel-tone-${tone}`}>
      <span className="travel-kpi-icon"><TravelIcon name={icon} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      {badge && <em>{badge}</em>}
    </article>
  );
}

function TripsRail({ trips, selectedId, onSelect, onAdd }: { trips: Trip[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void }) {
  return (
    <aside className="travel-card travel-list-card">
      <div className="travel-card-head">
        <h2>Moje podróże</h2>
        <button className="icon-btn" type="button" onClick={onAdd} aria-label="Dodaj podróż"><TravelIcon name="plus" /></button>
      </div>

      {trips.length === 0 ? (
        <EmptyState title="Brak podróży" cta="Dodaj" onCta={onAdd} />
      ) : (
        <div className="travel-trip-list">
          {trips.map((trip, index) => (
            <button
              key={trip.id}
              className={`travel-trip-item ${selectedId === trip.id ? 'is-selected' : ''}`}
              type="button"
              onClick={() => onSelect(trip.id)}
            >
              <span className={`travel-trip-icon travel-tone-${tripAccent(trip, index)}`}><TravelIcon name={trip.status === 'completed' ? 'check' : 'plane'} /></span>
              <span className="travel-trip-copy">
                <strong>{trip.title}</strong>
                <small>{fmtDate(trip.startDate)} - {fmtDate(trip.endDate)}</small>
              </span>
              <span className={`travel-status ${statusClass(trip.status)}`}>{STATUS_LABELS[trip.status]}</span>
            </button>
          ))}
        </div>
      )}

      <button className="travel-archive-btn" type="button">
        <TravelIcon name="archive" />
        <span>Archiwum podróży</span>
        <TravelIcon name="route" />
      </button>
    </aside>
  );
}

function TripCentral({ trip, packingState, onTogglePacking, onDelete }: { trip: Trip; packingState: Record<string, boolean>; onTogglePacking: (id: string, fallback: boolean) => void; onDelete: () => void }) {
  const budget = buildBudget(trip);
  const lodgings = buildLodgings(trip);
  const transport = buildTransport(trip);
  const tripDays = daysBetween(trip.startDate, trip.endDate);
  const budgetPct = Math.min(100, Math.round((budget.reserved / Math.max(trip.budget ?? budget.reserved, 1)) * 100));

  return (
    <main className="travel-central">
      <section className="travel-card travel-detail-card">
        <div className="travel-detail-top">
          <div className="travel-photo" style={{ backgroundImage: `url(${visualForTrip(trip)})` }} />
          <div className="travel-detail-copy">
            <div className="travel-detail-title">
              <div>
                <h2>{trip.title}</h2>
                <p><TravelIcon name="calendar" /> {fmtDate(trip.startDate)} - {fmtDate(trip.endDate)} <span>{tripDays} dni</span></p>
              </div>
              <button className="icon-btn" type="button" onClick={onDelete} aria-label="Usuń podróż"><IcoTrash /></button>
            </div>
            <div className="travel-mini-stats">
              <TravelMiniStat icon="calendar" label="Czas trwania" value={`${tripDays} dni`} />
              <TravelMiniStat icon="wallet" label="Budżet" value={trip.budget ? fmtPLN(trip.budget) : 'Nie ustawiono'} />
              <TravelMiniStat icon="check" label="Status" value={STATUS_LABELS[trip.status]} />
            </div>
          </div>
          <div className="travel-budget-overview">
            <span>Budżet całkowity</span>
            <strong>{trip.budget ? fmtPLN(trip.budget) : 'Nie ustawiono'}</strong>
            <small>Wydano {fmtPLN(budget.reserved)} ({budgetPct}%)</small>
            <div className="travel-progress"><i style={{ width: `${budgetPct}%` }} /></div>
            <div className="travel-budget-scale">
              <span>0 PLN</span>
              <span>{trip.budget ? fmtPLN(trip.budget) : fmtPLN(budget.reserved)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="travel-central-grid">
        <section className="travel-card travel-packing-card">
          <TravelSectionTitle code="A" title="Lista pakowania" />
          <div className="travel-pack-list">
            {PACKING_ITEMS.map((item) => {
              const checked = packingState[item.id] ?? item.packed;
              return (
                <button key={item.id} className={`travel-pack-item ${checked ? 'is-done' : ''}`} type="button" onClick={() => onTogglePacking(item.id, item.packed)}>
                  <span><TravelIcon name="check" /></span>
                  <strong>{item.label}</strong>
                </button>
              );
            })}
          </div>
        </section>

        <section className="travel-card travel-plan-card">
          <TravelSectionTitle code="B" title="Noclegi" />
          <div className="travel-table">
            <div className="travel-table-head"><span>Nazwa</span><span>Miejscowość</span><span>Daty</span><span>Cena</span><span>Link</span></div>
            {lodgings.map((row) => (
              <div className="travel-table-row" key={row.name}>
                <span>{row.name}</span><span>{row.place}</span><span>{row.dates}</span><strong>{fmtPLN(row.price)}</strong><a href="#">{row.link}</a>
              </div>
            ))}
          </div>
        </section>

        <section className="travel-card travel-budget-card">
          <TravelSectionTitle code="D" title="Planowany budżet" />
          <div className="travel-budget-list">
            {budget.rows.map((row) => {
              const pct = Math.round((row.amount / Math.max(trip.budget ?? budget.rows.reduce((sum, item) => sum + item.amount, 0), 1)) * 100);
              return (
                <div className="travel-budget-row" key={row.label}>
                  <span>{row.label}</span>
                  <strong>{fmtPLN(row.amount)}</strong>
                  <em>{pct}%</em>
                  <div className={`travel-progress travel-tone-${row.tone}`}><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="travel-budget-sum">
            <span>Suma</span>
            <strong>{fmtPLN(budget.rows.reduce((sum, row) => sum + row.amount, 0))}</strong>
          </div>
        </section>

        <section className="travel-card travel-transport-card">
          <TravelSectionTitle code="C" title="Transport" />
          <div className="travel-table">
            <div className="travel-table-head"><span>Typ</span><span>Trasa / szczegóły</span><span>Data</span><span>Przewoźnik</span><span>Cena</span></div>
            {transport.map((row) => (
              <div className="travel-table-row" key={`${row.type}-${row.route}`}>
                <span>{row.type}</span><span>{row.route}</span><span>{row.date}</span><span>{row.carrier}</span><strong>{fmtPLN(row.price)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="travel-card travel-notes-card">
          <TravelSectionTitle code="E" title="Notatki" />
          <ul>
            {(trip.notes ? trip.notes.split('\n') : [
              'Sprawdzić wymagane dokumenty przed wyjazdem',
              'Kupić lokalną kartę SIM lub eSIM',
              'Zarezerwować transfer z lotniska',
            ]).map((note) => <li key={note}>{note}</li>)}
          </ul>
        </section>

        <section className="travel-card travel-info-card">
          <TravelSectionTitle code="F" title="Ważne informacje" />
          <div className="travel-info-grid">
            <TravelInfo icon="shield" text="Paszport ważny do 20.12.2028" ok />
            <TravelInfo icon="document" text="Ubezpieczenie podróżne aktywne" ok />
            <TravelInfo icon="card" text="Karta eSIM gotowa do aktywacji" ok />
            <TravelInfo icon="info" text="Sprawdź wymogi wjazdowe przed lotem" />
          </div>
        </section>
      </div>
    </main>
  );
}

function TravelMiniStat({ icon, label, value }: { icon: TravelIconName; label: string; value: string }) {
  return (
    <div>
      <TravelIcon name={icon} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TravelSectionTitle({ code, title }: { code: string; title: string }) {
  return <h3 className="travel-section-title"><span>{code}.</span> {title}</h3>;
}

function TravelInfo({ icon, text, ok = false }: { icon: TravelIconName; text: string; ok?: boolean }) {
  return (
    <div className={`travel-info ${ok ? 'is-ok' : ''}`}>
      <TravelIcon name={icon} />
      <span>{text}</span>
    </div>
  );
}

function TravelAside({ trip, wishlist }: { trip: Trip | null; wishlist: WishlistPlace[] }) {
  const deadlines = buildDeadlines(trip);
  const destination = trip ? (trip.city || trip.country) : 'cel';
  const topWishlist = wishlist.filter((place) => !place.visited).slice(0, 3);

  return (
    <aside className="travel-side">
      <section className="travel-card">
        <div className="travel-card-head">
          <h2>Najbliższe terminy</h2>
          <TravelIcon name="calendar" />
        </div>
        <div className="travel-deadlines">
          {deadlines.map((item) => {
            const days = daysUntil(item.date);
            return (
              <div className="travel-deadline" key={item.id}>
                <time>
                  <strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit' })}</strong>
                  <span>{new Date(`${item.date}T12:00:00`).toLocaleDateString('pl-PL', { month: 'short' })}</span>
                </time>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </div>
                <em>{days >= 0 ? `za ${days} dni` : 'po terminie'}</em>
              </div>
            );
          })}
        </div>
      </section>

      <section className="travel-card">
        <div className="travel-card-head"><h2>Szybki podgląd</h2></div>
        <div className="travel-quick-grid">
          <TravelQuick icon="cloud" value="27°C" label={`Pogoda: ${destination}`} tone="clay" />
          <TravelQuick icon="wallet" value="IDR" label="Waluta lokalna" tone="violet" />
          <TravelQuick icon="hotel" value={trip ? String(daysBetween(trip.startDate, trip.endDate) - 1) : '-'} label="Noce w podróży" tone="blue" />
          <TravelQuick icon="check" value="OK" label="Dokumenty" tone="teal" />
        </div>
        <div className="travel-map-card">
          <div className="travel-map-route">
            <span />
            <i />
            <span />
          </div>
          <strong>{trip ? `${trip.city || trip.country} -> druga baza` : 'Trasa podróży'}</strong>
        </div>
        {topWishlist.length > 0 && (
          <div className="travel-wishlist-mini">
            <h3>Wishlist</h3>
            {topWishlist.map((place) => (
              <span key={place.id}><TravelIcon name="pin" /> {place.city ? `${place.city}, ` : ''}{place.country}</span>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

function TravelQuick({ icon, value, label, tone }: { icon: TravelIconName; value: string; label: string; tone: string }) {
  return (
    <div className={`travel-quick travel-tone-${tone}`}>
      <TravelIcon name={icon} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function TripModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void }) {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  function reset() {
    setTitle('');
    setCountry('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setBudget('');
  }

  return (
    <Modal open={open} onClose={onClose} title="Nowa podróż" footer={
      <>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" type="button" onClick={() => {
          if (!title.trim() || !country.trim() || !startDate || !endDate) return;
          onSave({
            title: title.trim(),
            country: country.trim(),
            city: city.trim() || undefined,
            startDate,
            endDate,
            status: 'planned',
            coverEmoji: '',
            notes: '',
            budget: budget.trim() ? Number(budget) : undefined,
            isArchived: false,
          });
          reset();
        }}>Zapisz</button>
      </>
    }>
      <Field label="Nazwa podróży" required><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Bali, Indonezja" /></Field>
      <div className="form-grid">
        <Field label="Kraj" required><input className="input" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Indonezja" /></Field>
        <Field label="Miasto"><input className="input" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bali" /></Field>
        <Field label="Data wyjazdu" required><input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></Field>
        <Field label="Data powrotu" required><input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field>
        <Field label="Budżet"><input className="input" type="number" min={0} value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="9500" /></Field>
      </div>
    </Modal>
  );
}

function TravelIcon({ name }: { name: TravelIconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'plane' && <><path d="M3 12 21 4l-5 16-4-7-7-1z" {...common} /><path d="m12 13 4-9" {...common} /></>}
      {name === 'suitcase' && <><rect x="5" y="7" width="14" height="13" rx="2" {...common} /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M9 12h6M8 20V7M16 20V7" {...common} /></>}
      {name === 'globe' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.2-3.3-8.5S9.8 5.9 12 3.5z" {...common} /></>}
      {name === 'wallet' && <><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4H17" {...common} /><path d="M16 13h4M16 13a1.5 1.5 0 0 0 0 3h4" {...common} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'filter' && <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" {...common} /></>}
      {name === 'more' && <><path d="M12 7h.01M12 12h.01M12 17h.01" {...common} /></>}
      {name === 'hotel' && <><path d="M4 20V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v14M2.5 20h19M8 8h.01M13 8h.01M8 12h.01M13 12h.01M8 20v-4h5v4" {...common} /></>}
      {name === 'bus' && <><rect x="4" y="5" width="16" height="12" rx="2" {...common} /><path d="M7 17v2M17 17v2M4 10h16M8 14h.01M16 14h.01" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
      {name === 'map' && <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15" {...common} /></>}
      {name === 'pin' && <><path d="M12 21s6-5.4 6-11A6 6 0 0 0 6 10c0 5.6 6 11 6 11z" {...common} /><circle cx="12" cy="10" r="2" {...common} /></>}
      {name === 'cloud' && <><path d="M7 18h10.5a3.5 3.5 0 0 0 .5-7A6 6 0 0 0 6.6 9.2 4.5 4.5 0 0 0 7 18z" {...common} /></>}
      {name === 'document' && <><path d="M7 3h7l4 4v14H7V3z" {...common} /><path d="M14 3v5h5M10 13h6M10 17h4" {...common} /></>}
      {name === 'shield' && <><path d="M12 21s7-3.5 7-9.5V5l-7-3-7 3v6.5C5 17.5 12 21 12 21z" {...common} /><path d="M9 12l2 2 4-5" {...common} /></>}
      {name === 'info' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 11v5M12 8h.01" {...common} /></>}
      {name === 'trash' && <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" {...common} /></>}
      {name === 'archive' && <><rect x="4" y="5" width="16" height="4" rx="1" {...common} /><path d="M6 9v10h12V9M10 13h4" {...common} /></>}
      {name === 'spark' && <><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" {...common} /></>}
      {name === 'route' && <><path d="M6 18c4 0 3-12 8-12h4" {...common} /><circle cx="5" cy="18" r="2" {...common} /><circle cx="19" cy="6" r="2" {...common} /></>}
      {name === 'card' && <><rect x="3" y="5" width="18" height="14" rx="2" {...common} /><path d="M3 10h18M7 15h4" {...common} /></>}
    </svg>
  );
}
