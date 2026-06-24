import { useState } from 'react';
import { Modal, Field } from '@/components/common';
import { useCreatePhase } from '@/features/sport/cycleHooks';
import type { Exercise, Sport, WorkoutTemplate } from '@/features/sport/types';
import { BlockForm } from './AddToPlanDrawer';

interface CyclePhaseModalProps {
  open: boolean;
  onClose: () => void;
  cycleId: string;
  nextOrderIndex: number;
  defaultDate: string;
  templates: WorkoutTemplate[];
  sports: Sport[];
  exercises: Exercise[];
}

/** "+ Dodaj mezocykl" — reuses the block builder (day assignments, conflict policy, progression)
 * and just links the resulting block to the cycle as a phase. */
export function CyclePhaseModal({ open, onClose, cycleId, nextOrderIndex, defaultDate, templates, sports, exercises }: CyclePhaseModalProps) {
  const createPhase = useCreatePhase();
  const [goal, setGoal] = useState('');

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Nowy mezocykl" size="lg">
      <div className="sport-form">
        <Field label="Cel mezocyklu (opcjonalnie)"><input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder='np. "Hipertrofia klatki i barków"' /></Field>
      </div>
      <BlockForm
        defaultDate={defaultDate} templates={templates} sports={sports} exercises={exercises}
        nameLabel="Nazwa mezocyklu" submitLabel="Dodaj mezocykl" initialName="Mezocykl"
        onSubmit={async (blockInput) => {
          await createPhase.mutateAsync({ cycleId, phase: { name: blockInput.name, goal: goal.trim() || null, orderIndex: nextOrderIndex }, blockInput });
          onClose();
        }}
      />
    </Modal>
  );
}
