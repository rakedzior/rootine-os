import { useState } from 'react';
import { Modal, StatusBadge, EmptyState } from '@/components/common';
import { useCycles } from '@/features/sport/cycleHooks';
import type { Sport } from '@/features/sport/types';
import { CYCLE_STATUS_BADGE_KEY, CYCLE_STATUS_LABEL, cycleGoalLabel } from './cycleConstants';
import { CycleEditorModal } from './CycleEditorModal';

interface CycleManagerModalProps {
  open: boolean;
  onClose: () => void;
  sports: Sport[];
  onOpenDetail: (cycleId: string) => void;
}

export function CycleManagerModal({ open, onClose, sports, onOpenDetail }: CycleManagerModalProps) {
  const { data: cycles = [] } = useCycles();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Cykle treningowe" size="lg" footer={<button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Nowy cykl</button>}>
        {cycles.length === 0 ? (
          <EmptyState title="Brak cykli treningowych" desc="Zaplanuj swój pierwszy cykl, np. blok hipertrofii albo przygotowanie do zawodów." cta="+ Nowy cykl" onCta={() => setCreating(true)} />
        ) : (
          <div className="sport-cycle-list">
            {cycles.map(c => (
              <button key={c.id} type="button" className="sport-cycle-row" onClick={() => onOpenDetail(c.id)}>
                <div>
                  <div className="sport-template-tile-name">{c.name}</div>
                  <div className="sport-history-row-meta">{cycleGoalLabel(c.goal)} · {c.start_date} – {c.end_date}</div>
                </div>
                <StatusBadge status={CYCLE_STATUS_BADGE_KEY[c.status]} label={CYCLE_STATUS_LABEL[c.status]} />
              </button>
            ))}
          </div>
        )}
      </Modal>
      <CycleEditorModal open={creating} onClose={() => setCreating(false)} sports={sports} onCreated={(cycle) => { onClose(); onOpenDetail(cycle.id); }} />
    </>
  );
}
