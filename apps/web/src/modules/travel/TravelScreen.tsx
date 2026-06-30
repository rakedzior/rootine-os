import { useEffect, useMemo, useState } from 'react';
import { Modal, EmptyState, ConfirmDelete, Field, PageHeader, IcoTrash } from '@/components/common';
import { PageLayout } from '@/components/layout/primitives';
import { useCreateTrip, useDeleteTrip, useTrips } from '@/features/travel/hooks';
import type { Trip as TripRow } from '@/features/travel/types';
import '@/styles/travel.css';

type TravelIconName =
  | 'plane' | 'calendar' | 'wallet' | 'plus' | 'filter' | 'more' | 'hotel' | 'bus'
  | 'check' | 'document' | 'shield' | 'info' | 'archive' | 'card' | 'wifi'
  | 'syringe' | 'copy' | 'alert' | 'clock' | 'package' | 'note' | 'route';

type TravelStatusFilter = Trip['status'] | 'all';
type TravelTab = 'overview' | 'plan' | 'lodging' | 'transport' | 'packing' | 'documents' | 'budget' | 'notes';

interface Trip {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  country: string;
  city?: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  coverEmoji: string;
  notes: string;
  budget?: number;
  isArchived: boolean;
}

const STATUS_LABELS: Record<Trip['status'], string> = {
  planned: 'Planowana',
  active: 'Trwająca',
  completed: 'Zakończona',
  archived: 'Archiwum',
};

const FILTER_LABELS: Record<TravelStatusFilter, string> = {
  all: 'Wszystkie',
  planned: 'Planowane',
  active: 'Trwające',
  completed: 'Zakończone',
  archived: 'Archiwum',
};

const PACKING_ITEMS = [
  { id: 'passport', label: 'Paszport', category: 'Dokumenty', packed: true },
  { id: 'adapter', label: 'Adapter podróżny', category: 'Elektronika', packed: true },
  { id: 'spf', label: 'Krem z filtrem', category: 'Kosmetyki', packed: true },
  { id: 'slides', label: 'Klapki', category: 'Ubrania', packed: false },
  { id: 'meds', label: 'Leki podstawowe', category: 'Zdrowie', packed: false },
  { id: 'powerbank', label: 'Powerbank', category: 'Elektronika', packed: false },
];

const PREP_ITEMS = [
  { id: 'documents', icon: 'document', label: 'Dokumenty podróży', status: 'Gotowe', tone: 'ok' },
  { id: 'insurance', icon: 'shield', label: 'Ubezpieczenie', status: 'Brakuje', tone: 'danger' },
  { id: 'transfer', icon: 'bus', label: 'Transfer z lotniska', status: 'Do potwierdzenia', tone: 'warn' },
  { id: 'packing', icon: 'package', label: 'Pakowanie', status: '9 rzeczy do spakowania', tone: 'warn' },
  { id: 'payments', icon: 'wallet', label: 'Płatności i budżet', status: 'W porządku', tone: 'ok' },
  { id: 'reservations', icon: 'card', label: 'Noclegi', status: 'Potwierdzone', tone: 'ok' },
  { id: 'place', icon: 'info', label: 'Informacje o miejscu', status: 'Gotowe', tone: 'ok' },
  { id: 'attractions', icon: 'route', label: 'Plan atrakcji', status: 'Opcjonalne', tone: 'muted' },
  { id: 'internet', icon: 'wifi', label: 'eSIM / Internet', status: 'Do aktywacji', tone: 'warn' },
  { id: 'vaccines', icon: 'syringe', label: 'Szczepienia', status: 'Nie dotyczy', tone: 'muted' },
  { id: 'copies', icon: 'copy', label: 'Kopie zapasowe', status: 'W porządku', tone: 'ok' },
  { id: 'contact', icon: 'info', label: 'Kontakt alarmowy', status: 'W porządku', tone: 'ok' },
] satisfies { id: string; icon: TravelIconName; label: string; status: string; tone: string }[];

function fmtDate(date?: string) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShortDate(date?: string) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
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

function locationLabel(trip: Trip) {
  return trip.city ? `${trip.city}, ${trip.country}` : trip.country;
}

function statusClass(status: Trip['status']) {
  if (status === 'active') return 'is-active';
  if (status === 'completed') return 'is-complete';
  if (status === 'archived') return 'is-archived';
  return 'is-planned';
}

function addLabelForTab(tab: TravelTab) {
  const labels: Record<TravelTab, string> = {
    overview: 'Dodaj',
    plan: 'Dodaj punkt planu',
    lodging: 'Dodaj nocleg',
    transport: 'Dodaj transport',
    packing: 'Dodaj rzecz',
    documents: 'Dodaj dokument',
    budget: 'Dodaj wydatek',
    notes: 'Dodaj notatkę',
  };
  return labels[tab];
}

function pickNextTrip(trips: Trip[]) {
  const upcoming = trips
    .filter((trip) => trip.status !== 'archived' && trip.status !== 'completed')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? trips.find((trip) => trip.status !== 'archived') ?? null;
}

function normalizeStatus(status: TripRow['status'], isArchived: boolean): Trip['status'] {
  if (isArchived || status === 'archived') return 'archived';
  if (status === 'done' || status === 'completed') return 'completed';
  if (status === 'active') return 'active';
  return 'planned';
}

function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.dest,
    country: row.country ?? '',
    city: row.city ?? undefined,
    startDate: row.start_date ?? row.created_at.split('T')[0],
    endDate: row.end_date ?? row.start_date ?? row.created_at.split('T')[0],
    status: normalizeStatus(row.status, row.is_archived),
    coverEmoji: row.cover_emoji ?? '',
    notes: row.notes ?? '',
    budget: row.budget == null ? undefined : Number(row.budget),
    isArchived: row.is_archived,
  };
}

function buildDeadlines(trip: Trip | null) {
  if (!trip) return [];
  const travelDays = daysBetween(trip.startDate, trip.endDate);
  return [
    { id: 'flight-out', icon: 'plane' as const, date: trip.startDate, title: `Wylot do ${trip.city || trip.country}` },
    { id: 'check-in', icon: 'hotel' as const, date: trip.startDate, title: 'Zameldowanie' },
    { id: 'local-transfer', icon: 'bus' as const, date: addDays(trip.startDate, Math.min(7, Math.max(1, travelDays - 2))), title: 'Przejazd lokalny' },
    { id: 'return', icon: 'plane' as const, date: trip.endDate, title: 'Powrót do domu' },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

function buildBudget(trip: Trip | null) {
  const total = trip?.budget || 25500;
  const spent = Math.round(total * 0.267);
  return { total, spent, left: total - spent, pct: Math.round((spent / total) * 100) };
}

function buildStay(trip: Trip | null) {
  const city = trip?.city || trip?.country || 'Bali';
  return {
    name: city.toLowerCase().includes('bali') ? 'Ubud Jungle Villa' : `Central ${city} Stay`,
    place: city,
    nights: trip ? Math.max(1, daysBetween(trip.startDate, trip.endDate) - 1) : 0,
    image: city.toLowerCase().includes('bali')
      ? 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=360&q=80'
      : 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=360&q=80',
  };
}

export function TravelScreen() {
  const tripsQuery = useTrips();
  const createTrip = useCreateTrip();
  const deleteTripMutation = useDeleteTrip();
  const trips = useMemo(() => (tripsQuery.data ?? []).map(mapTrip), [tripsQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(pickNextTrip(trips)?.id ?? null);
  const [filter, setFilter] = useState<TravelStatusFilter>('planned');
  const [activeTab, setActiveTab] = useState<TravelTab>('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [packingState, setPackingState] = useState<Record<string, boolean>>({});

  const visibleTrips = useMemo(() => {
    const filtered = filter === 'all'
      ? trips.filter((trip) => trip.status !== 'archived')
      : trips.filter((trip) => trip.status === filter);
    return [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filter, trips]);

  const selected = visibleTrips.find((trip) => trip.id === selectedId) ?? visibleTrips[0] ?? null;

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
    if (selectedId && visibleTrips.length > 0 && !visibleTrips.some((trip) => trip.id === selectedId)) setSelectedId(visibleTrips[0].id);
    if (selectedId && visibleTrips.length === 0) setSelectedId(null);
    if (selectedId && !trips.some((trip) => trip.id === selectedId)) setSelectedId(pickNextTrip(trips)?.id ?? null);
  }, [selectedId, selected, trips, visibleTrips]);

  function togglePacking(id: string, fallback: boolean) {
    setPackingState((state) => ({ ...state, [id]: !(state[id] ?? fallback) }));
  }

  return (
    <PageLayout
      className="travel-page"
      header={<PageHeader
        icon={<TravelIcon name="plane" />}
        title="Podróże"
        desc="Wszystkie wyjazdy i szczegóły podróży w jednym miejscu."
        actions={<>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowAdd(true)}>
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
        </>}
      />}
    >

      <section className="travel-dashboard">
        <TripsRail
          trips={visibleTrips}
          selectedId={selected?.id ?? null}
          filter={filter}
          onFilter={setFilter}
          onSelect={setSelectedId}
          onAdd={() => setShowAdd(true)}
        />

        <TripWorkspace
          trip={selected}
          activeTab={activeTab}
          packingState={packingState}
          onTabChange={setActiveTab}
          onTogglePacking={togglePacking}
          onDelete={() => selected && setDeleteId(selected.id)}
        />

      </section>

      <TripModal open={showAdd} onClose={() => setShowAdd(false)} onSave={(payload) => {
        createTrip.mutate({
          dest: payload.title,
          country: payload.country,
          city: payload.city ?? null,
          start_date: payload.startDate,
          end_date: payload.endDate,
          status: payload.status,
          notes: payload.notes,
          budget: payload.budget ?? null,
          cover_emoji: payload.coverEmoji,
          is_archived: payload.isArchived,
        });
        setShowAdd(false);
      }} />
      <ConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTripMutation.mutate(deleteId);
          setDeleteId(null);
          setSelectedId(null);
        }}
        label="tę podróż"
      />
    </PageLayout>
  );
}

function TripsRail({ trips, selectedId, filter, onFilter, onSelect, onAdd }: {
  trips: Trip[];
  selectedId: string | null;
  filter: TravelStatusFilter;
  onFilter: (filter: TravelStatusFilter) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const chips: TravelStatusFilter[] = ['planned', 'active', 'completed'];
  return (
    <aside className="travel-card travel-list-card">
      <div className="travel-card-head">
        <h2>Moje podróże</h2>
        <button className="icon-btn" type="button" onClick={onAdd} aria-label="Dodaj podróż"><TravelIcon name="plus" /></button>
      </div>

      {trips.length === 0 ? (
        <EmptyState title="Brak podróży w tej kategorii" cta="Dodaj podróż" onCta={onAdd} />
      ) : (
        <div className="travel-trip-list">
          {trips.map((trip) => (
            <button
              key={trip.id}
              className={`travel-trip-item ${selectedId === trip.id ? 'is-selected' : ''}`}
              type="button"
              onClick={() => onSelect(trip.id)}
            >
              <span className="travel-trip-icon"><TravelIcon name="plane" /></span>
              <span className="travel-trip-copy">
                <strong>{trip.title}</strong>
                <small>{fmtDate(trip.startDate)} - {fmtDate(trip.endDate)}</small>
              </span>
              <span className={`travel-status ${statusClass(trip.status)}`}>{STATUS_LABELS[trip.status]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="travel-rail-filters" aria-label="Filtr statusu podróży">
        {chips.map((chip) => (
          <button key={chip} type="button" className={filter === chip ? 'is-active' : ''} onClick={() => onFilter(chip)}>
            {FILTER_LABELS[chip]}
          </button>
        ))}
      </div>

      <button className="travel-archive-btn" type="button" onClick={() => onFilter('archived')}>
        <TravelIcon name="archive" />
        <span>Archiwum podróży</span>
        <span>›</span>
      </button>
    </aside>
  );
}

function TripWorkspace({ trip, activeTab, packingState, onTabChange, onTogglePacking, onDelete }: {
  trip: Trip | null;
  activeTab: TravelTab;
  packingState: Record<string, boolean>;
  onTabChange: (tab: TravelTab) => void;
  onTogglePacking: (id: string, fallback: boolean) => void;
  onDelete: () => void;
}) {
  if (!trip) {
    return <main className="travel-card travel-empty-main"><EmptyState title="Brak wybranej podróży" desc="Dodaj lub wybierz podróż z listy." /></main>;
  }

  const deadlines = buildDeadlines(trip);
  const budget = buildBudget(trip);
  const stay = buildStay(trip);
  const travelDays = daysBetween(trip.startDate, trip.endDate);
  const missingPacking = PACKING_ITEMS.filter((item) => !(packingState[item.id] ?? item.packed)).length;

  return (
    <main className="travel-central">
      <section className="travel-card travel-main-trip">
        <div className="travel-module-topbar">
          <TravelTabs active={activeTab} onChange={onTabChange} />
          <button className="btn btn-primary btn-sm travel-tab-add" type="button" aria-label={addLabelForTab(activeTab)} title={addLabelForTab(activeTab)}>
            <TravelIcon name="plus" /> {addLabelForTab(activeTab)}
          </button>
        </div>

        <div className="travel-trip-top">
          <div className="travel-trip-title-block">
            <div className="travel-main-head">
              <div>
                <h2>{trip.title}</h2>
                <p>{fmtDate(trip.startDate)} - {fmtDate(trip.endDate)} ({travelDays} dni)</p>
              </div>
              <button className="icon-btn" type="button" aria-label="Usuń podróż" onClick={onDelete}><IcoTrash /></button>
            </div>
          </div>

        </div>

        <div className={`travel-main-grid is-${activeTab}`}>
          {activeTab === 'overview' && (
            <>
              <AlertsCard trip={trip} missingPacking={missingPacking} onAction={onTabChange} />
              <TimelineCard deadlines={deadlines} />
              <PrepCard onAction={onTabChange} />
              <NotesCard trip={trip} />
            </>
          )}
          {activeTab === 'plan' && <TimelineCard deadlines={deadlines} expanded />}
          {activeTab === 'lodging' && <StayCard trip={trip} stay={stay} />}
          {activeTab === 'transport' && <TransportCard trip={trip} deadlines={deadlines} />}
          {activeTab === 'packing' && <PackingCard packingState={packingState} onToggle={onTogglePacking} onOpen={() => onTabChange('packing')} />}
          {activeTab === 'documents' && <DocumentsCard onOpen={() => onTabChange('documents')} />}
          {activeTab === 'budget' && <BudgetCard budget={budget} onShowBudget={() => onTabChange('budget')} />}
          {activeTab === 'notes' && <NotesCard trip={trip} />}
        </div>
      </section>
    </main>
  );
}

function TravelTabs({ active, onChange }: { active: TravelTab; onChange: (tab: TravelTab) => void }) {
  const tabs: { id: TravelTab; label: string; icon: TravelIconName }[] = [
    { id: 'overview', label: 'Przegląd', icon: 'info' },
    { id: 'plan', label: 'Plan', icon: 'calendar' },
    { id: 'lodging', label: 'Noclegi', icon: 'hotel' },
    { id: 'transport', label: 'Transport', icon: 'bus' },
    { id: 'packing', label: 'Pakowanie', icon: 'package' },
    { id: 'documents', label: 'Dokumenty', icon: 'document' },
    { id: 'budget', label: 'Budżet', icon: 'wallet' },
    { id: 'notes', label: 'Notatki', icon: 'note' },
  ];
  return (
    <div className="travel-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'is-active' : ''}
          onClick={() => onChange(tab.id)}
        >
          <TravelIcon name={tab.icon} /> {tab.label}
        </button>
      ))}
    </div>
  );
}

function TimelineCard({ deadlines, expanded = false }: { deadlines: ReturnType<typeof buildDeadlines>; expanded?: boolean }) {
  return (
    <section className="travel-card travel-plan-card">
      <h3>Najbliższe terminy</h3>
      <div className="travel-timeline">
        {deadlines.map((item) => (
          <button key={item.id} type="button">
            <TravelIcon name={item.icon} />
            <span>
              <strong>{item.title}</strong>
              <small>{fmtDate(item.date)} · za {Math.max(0, daysUntil(item.date))} dni</small>
            </span>
            <em>›</em>
          </button>
        ))}
      </div>
      {expanded && (
        <div className="travel-plan-note">
          <strong>Plan dnia i terminy</strong>
          <p>Najważniejsze punkty wyjazdu są ułożone chronologicznie. Noclegi, transport, dokumenty i budżet mają teraz osobne zakładki.</p>
        </div>
      )}
    </section>
  );
}

function StayCard({ trip, stay }: { trip: Trip; stay: ReturnType<typeof buildStay> }) {
  return (
    <section className="travel-card travel-stay-card">
      <h3>Nocleg</h3>
      <div className="travel-stay">
        <img src={stay.image} alt="" />
        <div>
          <strong>{stay.name}</strong>
          <span>{fmtShortDate(trip.startDate)} - {fmtShortDate(trip.endDate)}</span>
          <small>{stay.nights} noce · {stay.place}</small>
        </div>
      </div>
      <button type="button">Zobacz rezerwację <TravelIcon name="route" /></button>
    </section>
  );
}

function TransportCard({ trip, deadlines }: { trip: Trip; deadlines: ReturnType<typeof buildDeadlines> }) {
  const transportItems = deadlines.filter((item) => item.icon === 'plane' || item.icon === 'bus');
  return (
    <section className="travel-card travel-transport-card">
      <div className="travel-card-head">
        <h3>Transport</h3>
        <span>{transportItems.length} etapy</span>
      </div>
      <div className="travel-detail-list">
        {transportItems.map((item) => (
          <article key={item.id}>
            <span className="travel-row-icon"><TravelIcon name={item.icon} /></span>
            <div>
              <strong>{item.title}</strong>
              <small>{fmtDate(item.date)} · {locationLabel(trip)}</small>
            </div>
            <em>{item.id === 'local-transfer' ? 'Do potwierdzenia' : 'Planowane'}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function DocumentsCard({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const documents = [
    { id: 'passport', icon: 'document' as const, label: 'Paszport', status: 'Gotowe', tone: 'ok' },
    { id: 'insurance', icon: 'shield' as const, label: 'Ubezpieczenie', status: 'Brakuje', tone: 'danger' },
    { id: 'tickets', icon: 'card' as const, label: 'Bilety i rezerwacje', status: 'Potwierdzone', tone: 'ok' },
    { id: 'copies', icon: 'copy' as const, label: 'Kopie dokumentów', status: 'W porządku', tone: 'ok' },
    { id: 'internet', icon: 'wifi' as const, label: 'eSIM / Internet', status: 'Do aktywacji', tone: 'warn' },
  ];
  const visible = compact ? documents.slice(0, 4) : documents;
  return (
    <section className="travel-card travel-documents-card">
      <div className="travel-card-head">
        <h3>Dokumenty</h3>
        <span>{documents.filter((item) => item.tone === 'ok').length} / {documents.length}</span>
      </div>
      <div className="travel-detail-list">
        {visible.map((item) => (
          <article key={item.id} className={`is-${item.tone}`}>
            <span className="travel-row-icon"><TravelIcon name={item.icon} /></span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.tone === 'danger' ? 'Wymaga uzupełnienia przed wyjazdem' : 'Status przygotowania'}</small>
            </div>
            <em>{item.status}</em>
          </article>
        ))}
      </div>
      {compact && <button className="travel-panel-link" type="button" onClick={onOpen}>Otwórz dokumenty ›</button>}
    </section>
  );
}

function BudgetCard({ budget, onShowBudget }: { budget: ReturnType<typeof buildBudget>; onShowBudget: () => void }) {
  return (
    <section className="travel-card travel-budget-card">
      <div className="travel-card-head">
        <h3>Budżet</h3>
        <button type="button" onClick={onShowBudget}>+ Wydatek</button>
      </div>
      <div className="travel-budget-numbers">
        <span>Planowany <strong>{fmtPLN(budget.total)}</strong></span>
        <span>Wydane <strong>{fmtPLN(budget.spent)}</strong></span>
        <span>Pozostało <strong>{fmtPLN(budget.left)}</strong></span>
      </div>
      <div className="travel-progress"><i style={{ width: `${budget.pct}%` }} /></div>
      <small>{budget.pct}% wydane</small>
    </section>
  );
}

function PackingCard({ packingState, onToggle, onOpen, compact = false }: { packingState: Record<string, boolean>; onToggle: (id: string, fallback: boolean) => void; onOpen: () => void; compact?: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const packed = PACKING_ITEMS.filter((item) => packingState[item.id] ?? item.packed).length;
  const pct = Math.round((packed / PACKING_ITEMS.length) * 100);
  const categories = Array.from(new Set(PACKING_ITEMS.map((item) => item.category)));
  const scopedItems = activeCategory === 'all' ? PACKING_ITEMS : PACKING_ITEMS.filter((item) => item.category === activeCategory);
  const visibleItems = compact ? scopedItems.slice(0, 4) : scopedItems;
  const groups = visibleItems.reduce<Record<string, typeof visibleItems>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});
  return (
    <section className="travel-card travel-packing-card">
      <div className="travel-card-head">
        <h3>Lista pakowania</h3>
        <span>{packed} / {PACKING_ITEMS.length} ({pct}%)</span>
      </div>
      <div className="travel-progress"><i style={{ width: `${pct}%` }} /></div>
      <div className="travel-pack-categories" aria-label="Kategorie pakowania">
        <button type="button" className={activeCategory === 'all' ? 'is-active' : ''} onClick={() => setActiveCategory('all')}>Wszystkie</button>
        {categories.map((category) => (
          <button key={category} type="button" className={activeCategory === category ? 'is-active' : ''} onClick={() => setActiveCategory(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className="travel-pack-list">
        {Object.entries(groups).map(([category, items]) => (
          <div className="travel-pack-category" key={category}>
            <span>{category}</span>
            {items.map((item) => {
              const checked = packingState[item.id] ?? item.packed;
              return (
                <button key={item.id} className={checked ? 'is-done' : ''} type="button" onClick={() => onToggle(item.id, item.packed)}>
                  <span>{checked && <TravelIcon name="check" />}</span>{item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {compact && <button className="travel-panel-link" type="button" onClick={onOpen}>Zobacz całą listę ›</button>}
    </section>
  );
}

function NotesCard({ trip }: { trip: Trip }) {
  return (
    <section className="travel-card travel-notes-card">
      <h3>Notatki</h3>
      <p>{trip.notes || 'Sprawdzić wymagania wizowe przed wylotem. Zabrać gotówkę w lokalnej walucie na pierwsze dni.'}</p>
      <span>Zaktualizowano {fmtDate(trip.updatedAt.split('T')[0] || trip.startDate)}</span>
    </section>
  );
}

function AlertsCard({ trip, missingPacking, onAction }: { trip: Trip; missingPacking: number; onAction: (tab: TravelTab) => void }) {
  return (
    <section className="travel-card travel-alert-card">
      <div className="travel-card-head">
        <h2>Wymaga uwagi</h2>
        <span>4</span>
      </div>
      <WarningRow icon="alert" title="Brakuje potwierdzenia ubezpieczenia" desc="Dokument wymagany przed wylotem." onClick={() => onAction('documents')} />
      <WarningRow icon="clock" title={`${missingPacking} rzeczy niedokończonych na liście pakowania`} desc="Dokończ pakowanie przed wyjazdem." onClick={() => onAction('packing')} />
      <WarningRow icon="clock" title="Transfer z lotniska - do potwierdzenia" desc={`Brak potwierdzenia odbioru z lotniska w ${trip.city || trip.country}.`} onClick={() => onAction('transport')} />
      <WarningRow icon="clock" title="Sprawdź ważność paszportu" desc="Dokument powinien być ważny minimum 6 miesięcy." onClick={() => onAction('documents')} />
    </section>
  );
}

function PrepCard({ onAction }: { onAction: (tab: TravelTab) => void }) {
  return (
    <section className="travel-card travel-prep-card">
      <div className="travel-card-head">
        <h2>Przygotowania do wyjazdu</h2>
        <span>11 / 12</span>
      </div>
      <div className="travel-prep-list">
        {PREP_ITEMS.map((item) => (
          <button key={item.id} type="button" className={`is-${item.tone}`} onClick={() => {
            if (item.id === 'packing') onAction('packing');
            else if (item.id === 'payments') onAction('budget');
            else if (item.id === 'documents' || item.id === 'insurance') onAction('documents');
            else if (item.id === 'reservations') onAction('lodging');
            else if (item.id === 'transfer') onAction('transport');
            else onAction('plan');
          }}>
            <TravelIcon name={item.icon} />
            <span>{item.label}</span>
            <strong>{item.status}</strong>
            <em>{item.tone === 'ok' ? '✓' : item.tone === 'warn' ? '◷' : item.tone === 'danger' ? '△' : '›'}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function WarningRow({ icon, title, desc, onClick }: { icon: TravelIconName; title: string; desc: string; onClick: () => void }) {
  return (
    <button className="travel-warning-row" type="button" onClick={onClick}>
      <TravelIcon name={icon} />
      <span><strong>{title}</strong><small>{desc}</small></span>
      <em>›</em>
    </button>
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
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      {name === 'plane' && <><path d="M3 12 21 4l-5 16-4-7-7-1z" {...common} /><path d="m12 13 4-9" {...common} /></>}
      {name === 'calendar' && <><rect x="4" y="5" width="16" height="15" rx="2.5" {...common} /><path d="M8 3v4M16 3v4M4 10h16" {...common} /></>}
      {name === 'wallet' && <><path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4H17" {...common} /><path d="M16 13h4M16 13a1.5 1.5 0 0 0 0 3h4" {...common} /></>}
      {name === 'plus' && <><path d="M12 5v14M5 12h14" {...common} /></>}
      {name === 'filter' && <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" {...common} /></>}
      {name === 'more' && <><path d="M12 7h.01M12 12h.01M12 17h.01" {...common} /></>}
      {name === 'hotel' && <><path d="M4 20V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v14M2.5 20h19M8 8h.01M13 8h.01M8 12h.01M13 12h.01M8 20v-4h5v4" {...common} /></>}
      {name === 'bus' && <><rect x="4" y="5" width="16" height="12" rx="2" {...common} /><path d="M7 17v2M17 17v2M4 10h16M8 14h.01M16 14h.01" {...common} /></>}
      {name === 'check' && <><path d="M20 6 9 17l-5-5" {...common} /></>}
      {name === 'document' && <><path d="M7 3h7l4 4v14H7V3z" {...common} /><path d="M14 3v5h5M10 13h6M10 17h4" {...common} /></>}
      {name === 'shield' && <><path d="M12 21s7-3.5 7-9.5V5l-7-3-7 3v6.5C5 17.5 12 21 12 21z" {...common} /><path d="M9 12l2 2 4-5" {...common} /></>}
      {name === 'info' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 11v5M12 8h.01" {...common} /></>}
      {name === 'archive' && <><rect x="4" y="5" width="16" height="4" rx="1" {...common} /><path d="M6 9v10h12V9M10 13h4" {...common} /></>}
      {name === 'card' && <><rect x="3" y="5" width="18" height="14" rx="2" {...common} /><path d="M3 10h18M7 15h4" {...common} /></>}
      {name === 'wifi' && <><path d="M5 10a11 11 0 0 1 14 0M8 13a6.5 6.5 0 0 1 8 0M11 16a2 2 0 0 1 2 0M12 19h.01" {...common} /></>}
      {name === 'syringe' && <><path d="m18 2 4 4M17 7l-3-3M19 9l-4-4-9 9v4h4l9-9zM6 14l4 4M4 20l3-3" {...common} /></>}
      {name === 'copy' && <><rect x="8" y="8" width="11" height="11" rx="2" {...common} /><path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...common} /></>}
      {name === 'alert' && <><path d="M12 9v4M12 17h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" {...common} /></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="8.5" {...common} /><path d="M12 7v5l3 2" {...common} /></>}
      {name === 'package' && <><path d="m12 3 8 4-8 4-8-4 8-4zM4 7v10l8 4 8-4V7M12 11v10" {...common} /></>}
      {name === 'note' && <><path d="M6 3h9l3 3v15H6V3zM15 3v4h4M9 12h6M9 16h5" {...common} /></>}
      {name === 'route' && <><path d="M6 18c4 0 3-12 8-12h4" {...common} /><circle cx="5" cy="18" r="2" {...common} /><circle cx="19" cy="6" r="2" {...common} /></>}
    </svg>
  );
}
