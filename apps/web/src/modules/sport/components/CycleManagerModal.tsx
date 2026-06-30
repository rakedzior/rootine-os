import { useEffect, useState } from 'react';
import { Modal, StatusBadge } from '@/components/common';
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
  const { data: cycles, isLoading } = useCycles();
  const cycleList = cycles ?? [];
  const [creating, setCreating] = useState(false);
  const openCreator = () => setCreating(true);
  const closeCreator = () => {
    setCreating(false);
    if (cycleList.length === 0) onClose();
  };

  useEffect(() => {
    if (open && !isLoading && cycleList.length === 0) {
      setCreating(true);
    }
  }, [cycleList.length, isLoading, open]);

  return (
    <>
      <Modal open={open && !creating} onClose={onClose} title="Cykle treningowe" size="lg" className="sport-cycle-manager-modal">
        <div className="sport-cycle-manager">
          <div className="sport-cycle-manager-hero">
            <div>
              <span className="sport-cycle-manager-kicker">{cycleList.length} aktywnych i zapisanych</span>
              <h3>Proste plany tygodniowe</h3>
              <p>Każdy cykl to lista tygodni. Otwórz cykl, wybierz szablon albo wpisz plan ręcznie i zastosuj go tam, gdzie trzeba.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openCreator}>+ Nowy cykl</button>
          </div>

          <div className="sport-cycle-manager-list">
            {cycleList.map(c => (
              <button key={c.id} type="button" className="sport-cycle-manager-row" onClick={() => onOpenDetail(c.id)}>
                <div className="sport-cycle-manager-row-main">
                  <strong>{c.name}</strong>
                  <span>{cycleGoalLabel(c.goal)} · {c.start_date} – {c.end_date} · {c.duration_weeks} tyg.</span>
                </div>
                <StatusBadge status={CYCLE_STATUS_BADGE_KEY[c.status]} label={CYCLE_STATUS_LABEL[c.status]} />
              </button>
            ))}
          </div>
        </div>
      </Modal>
      <CycleEditorModal open={creating} onClose={closeCreator} sports={sports} onCreated={(cycle) => { setCreating(false); onClose(); onOpenDetail(cycle.id); }} />
    </>
  );
}
