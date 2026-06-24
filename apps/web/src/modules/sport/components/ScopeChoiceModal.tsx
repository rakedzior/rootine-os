import { Modal } from '@/components/common';
import type { EditScope } from '@/features/sport/types';

interface ScopeChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onChoose: (scope: EditScope) => void;
  title?: string;
  /** Most flows don't need the "this and future" middle option (e.g. plain delete). */
  showThisAndFuture?: boolean;
}

/** "Co chcesz zmienić?" / "Co usunąć?" — spec §3.4 / §7.7 / §17.4 / §17.5. */
export function ScopeChoiceModal({ open, onClose, onChoose, title = 'Co chcesz zmienić?', showThisAndFuture = true }: ScopeChoiceModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="sport-scope-choices">
        <button className="btn btn-secondary" onClick={() => { onChoose('this'); onClose(); }}>Tylko ten trening</button>
        {showThisAndFuture && (
          <button className="btn btn-secondary" onClick={() => { onChoose('thisAndFuture'); onClose(); }}>Ten i przyszłe treningi</button>
        )}
        <button className="btn btn-secondary" onClick={() => { onChoose('all'); onClose(); }}>Cały blok / serię</button>
        <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
      </div>
    </Modal>
  );
}
