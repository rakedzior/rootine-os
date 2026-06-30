import { useState } from 'react';
import { ModuleCard, ModuleHeader } from '@/components/layout/primitives';
import { EmptyState, Modal, FilterBar, FilterSelect, ConfirmDelete, MoreMenu, StatusBadge } from '@/components/common';
import { useHistory, useSports, useSessionFull } from '@/features/sport/hooks';
import { deleteSession } from '@/features/sport/services/sportRepository';
import { useQueryClient } from '@tanstack/react-query';
import type { TrainingSession } from '@/features/sport/types';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export function HistoryPanel() {
  const { data: recent = [] } = useHistory({ limit: 5 });
  const [fullOpen, setFullOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <ModuleCard className="sport-panel">
      <ModuleHeader title="Historia treningów" actions={<button className="btn btn-ghost btn-sm" onClick={() => setFullOpen(true)}>Zobacz całą historię</button>} />
      {recent.length === 0 ? (
        <EmptyState title="Historia pojawi się po zakończeniu pierwszej sesji." />
      ) : (
        <div className="sport-history-list">
          {recent.map(s => <HistoryRow key={s.id} session={s} onOpen={() => setDetailId(s.id)} />)}
        </div>
      )}
      <FullHistoryModal
        open={fullOpen}
        onClose={() => setFullOpen(false)}
        onOpenDetail={(id) => { setFullOpen(false); setDetailId(id); }}
      />
      <SessionDetailModal sessionId={detailId} onClose={() => setDetailId(null)} />
    </ModuleCard>
  );
}

function HistoryRow({ session, onOpen }: { session: TrainingSession; onOpen: () => void }) {
  return (
    <div className="sport-history-row" onClick={onOpen}>
      <div>
        <div className="sport-history-row-title">{session.title}</div>
        <div className="sport-history-row-meta">{fmtDate(session.started_at)} · {session.duration_min ?? '—'} min</div>
      </div>
      <div className="sport-history-row-volume">{session.total_volume_kg ? `${Math.round(session.total_volume_kg).toLocaleString('pl-PL')} kg` : '—'}</div>
    </div>
  );
}

function FullHistoryModal({ open, onClose, onOpenDetail }: { open: boolean; onClose: () => void; onOpenDetail: (id: string) => void }) {
  const { data: sports = [] } = useSports();
  const [sportId, setSportId] = useState('all');
  const { data: sessions = [] } = useHistory({ sportId: sportId === 'all' ? undefined : sportId });

  return (
    <Modal open={open} onClose={onClose} title="Historia treningów" size="lg">
      <FilterBar>
        <FilterSelect label="Sport" value={sportId} onChange={setSportId} options={[{ value: 'all', label: 'Wszystkie' }, ...sports.map(s => ({ value: s.id, label: s.name }))]} />
      </FilterBar>
      <div className="sport-history-list">
        {sessions.map(s => (
          <div key={s.id} className="sport-history-row" onClick={() => onOpenDetail(s.id)}>
            <div>
              <div className="sport-history-row-title">{s.title}</div>
              <div className="sport-history-row-meta">{fmtDate(s.started_at)} · {s.duration_min ?? '—'} min</div>
            </div>
            <StatusBadge status={s.status === 'completed' ? 'done' : s.status === 'cancelled' ? 'cancelled' : 'active'} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function SessionDetailModal({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
  const { data: session } = useSessionFull(sessionId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qc = useQueryClient();

  if (!session) return null;
  return (
    <Modal open={!!sessionId} onClose={onClose} title={session.title} size="md">
      <div className="sport-session-detail">
        <div className="sport-history-row-meta">{fmtDate(session.started_at)} · {session.duration_min ?? '—'} min · {session.total_volume_kg ? `${Math.round(session.total_volume_kg)} kg` : ''}</div>
        {session.exercises.map(e => (
          <div key={e.id} className="sport-session-detail-exercise">
            <strong>{e.name_snapshot}</strong>
            <ul>
              {e.sets.map(s => (
                <li key={s.id}>{s.actual_weight_kg ?? '—'} kg × {s.actual_reps ?? '—'} {s.completed ? '✓' : ''}</li>
              ))}
            </ul>
          </div>
        ))}
        {session.notes && <p className="sport-session-detail-notes">{session.notes}</p>}
        <div className="sport-form-actions">
          <MoreMenu label="Akcje" items={[{ label: 'Usuń z historii', onClick: () => setConfirmDelete(true), danger: true }]} />
        </div>
      </div>
      <ConfirmDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} label={`trening "${session.title}"`} onConfirm={async () => {
        await deleteSession(session.id);
        qc.invalidateQueries({ queryKey: ['sport', 'history'] });
        onClose();
      }} />
    </Modal>
  );
}
