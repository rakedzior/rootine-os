import { useEffect, useMemo, useState } from 'react';
import { Modal, Field, IcoCheck, IcoPlus } from '@/components/common';
import {
  useSessionFull, useCheckSet, useUncheckSet, useEditSetValues, useSkipRest, useAdjustRest,
  useAddManualExercise, useAddManualSet, useCompleteSession, useCancelSession,
} from '@/features/sport/hooks';
import { remainingRestSeconds, DEFAULT_REST_SECONDS, type SessionSummaryInput } from '@/features/sport/services/sessionService';
import type { SessionSet } from '@/features/sport/types';
import { IcoPause, IcoPlay } from './icons';

interface ActiveSessionScreenProps {
  sessionId: string;
  onExit: () => void;
}

function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ActiveSessionScreen({ sessionId, onExit }: ActiveSessionScreenProps) {
  const { data: session } = useSessionFull(sessionId);
  const checkSet = useCheckSet(sessionId);
  const uncheckSet = useUncheckSet(sessionId);
  const editSet = useEditSetValues(sessionId);
  const skipRest = useSkipRest(sessionId);
  const adjustRest = useAdjustRest(sessionId);
  const addManualExercise = useAddManualExercise(sessionId);
  const addManualSet = useAddManualSet(sessionId);
  const completeSession = useCompleteSession();
  const cancelSession = useCancelSession();

  const [drafts, setDrafts] = useState<Record<string, { weight: string; reps: string; rir: string }>>({});
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const allSets = useMemo(() => session?.exercises.flatMap(e => e.sets) ?? [], [session]);
  const activeRest = useMemo(() => {
    const candidates = allSets.filter(s => s.rest_started_at && !s.rest_completed && remainingRestSeconds(s) > 0);
    return candidates.sort((a, b) => new Date(b.rest_started_at!).getTime() - new Date(a.rest_started_at!).getTime())[0] ?? null;
  }, [allSets, tick]);

  const elapsedSeconds = session?.started_at ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000) : 0;

  function defaultDraft(set: SessionSet) {
    return {
      weight: String(set.actual_weight_kg ?? set.target_weight_kg ?? ''),
      reps: String(set.actual_reps ?? set.target_reps_min ?? ''),
      rir: String(set.actual_rir ?? set.target_rir ?? ''),
    };
  }
  function draftFor(set: SessionSet) {
    return drafts[set.id] ?? defaultDraft(set);
  }
  function patchDraft(set: SessionSet, patch: Partial<{ weight: string; reps: string; rir: string }>) {
    setDrafts(d => ({ ...d, [set.id]: { ...(d[set.id] ?? defaultDraft(set)), ...patch } }));
  }

  function toggleSet(set: SessionSet) {
    if (set.completed) {
      uncheckSet.mutate([set.id]);
      return;
    }
    const draft = draftFor(set);
    checkSet.mutate([set.id, {
      weight: draft.weight ? Number(draft.weight) : null,
      reps: draft.reps ? Number(draft.reps) : null,
      rir: draft.rir ? Number(draft.rir) : null,
    }, set.rest_duration_seconds ?? DEFAULT_REST_SECONDS]);
  }

  if (!session) return null;

  return (
    <div className="sport-active-session">
      <header className="sport-active-session-head">
        <div>
          <div className="sport-active-session-title">{session.title}</div>
          <div className="sport-active-session-clock">{fmtClock(elapsedSeconds)}</div>
        </div>
        <div className="sport-active-session-actions">
          <button className="btn btn-ghost btn-sm" onClick={onExit}>Powrót do Sportu</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPaused(p => !p)}>{paused ? <IcoPlay /> : <IcoPause />} {paused ? 'Wznów' : 'Pauza'}</button>
          <button className="btn btn-danger btn-sm" onClick={async () => { await cancelSession.mutateAsync(sessionId); onExit(); }}>Zakończ</button>
        </div>
      </header>

      {activeRest && (
        <div className="sport-rest-banner">
          <span>Odpoczynek: {fmtClock(remainingRestSeconds(activeRest))}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => adjustRest.mutate([activeRest, 15])}>+15s</button>
          <button className="btn btn-ghost btn-sm" onClick={() => adjustRest.mutate([activeRest, 30])}>+30s</button>
          <button className="btn btn-ghost btn-sm" onClick={() => adjustRest.mutate([activeRest, 60])}>+60s</button>
          <button className="btn btn-ghost btn-sm" onClick={() => skipRest.mutate([activeRest.id])}>Pomiń</button>
        </div>
      )}

      <div className="sport-active-session-body">
        {session.exercises.map(ex => (
          <div key={ex.id} className="sport-active-exercise">
            <div className="sport-active-exercise-head">{ex.name_snapshot}</div>
            <div className="sport-active-sets">
              {ex.sets.map((s, i) => {
                const d = draftFor(s);
                return (
                  <div key={s.id} className={`sport-active-set${s.completed ? ' is-completed' : ''}`}>
                    <span className="sport-active-set-index">Seria {i + 1}</span>
                    <input className="input sport-set-cell" type="number" value={d.weight} onChange={(e) => { patchDraft(s, { weight: e.target.value }); if (s.completed) editSet.mutate([s.id, { actual_weight_kg: e.target.value ? +e.target.value : null }]); }} placeholder="kg" />
                    <input className="input sport-set-cell" type="number" value={d.reps} onChange={(e) => { patchDraft(s, { reps: e.target.value }); if (s.completed) editSet.mutate([s.id, { actual_reps: e.target.value ? +e.target.value : null }]); }} placeholder="powt." />
                    <input className="input sport-set-cell" type="number" value={d.rir} onChange={(e) => { patchDraft(s, { rir: e.target.value }); if (s.completed) editSet.mutate([s.id, { actual_rir: e.target.value ? +e.target.value : null }]); }} placeholder="RIR" />
                    <button className={`sport-set-check${s.completed ? ' is-checked' : ''}`} onClick={() => toggleSet(s)} aria-label="Odhacz serię">{s.completed && <IcoCheck />}</button>
                  </div>
                );
              })}
              <button className="btn btn-ghost btn-sm" onClick={() => addManualSet.mutate([ex.id, ex.sets.length + 1])}><IcoPlus /> Dodaj serię</button>
            </div>
          </div>
        ))}

        <div className="sport-active-add-exercise">
          <input className="input" placeholder="Nazwa ćwiczenia..." value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} />
          <button className="btn btn-secondary btn-sm" disabled={!newExerciseName.trim()} onClick={async () => {
            await addManualExercise.mutateAsync([newExerciseName.trim(), session.exercises.length]);
            setNewExerciseName('');
          }}><IcoPlus /> Dodaj ćwiczenie</button>
        </div>
      </div>

      <footer className="sport-active-session-footer">
        <button className="btn btn-primary" onClick={() => setFinishOpen(true)}>Zakończ trening</button>
      </footer>

      <FinishSessionModal open={finishOpen} onClose={() => setFinishOpen(false)} onConfirm={async (summary) => {
        await completeSession.mutateAsync({ sessionId, summary });
        setFinishOpen(false);
        onExit();
      }} />
    </div>
  );
}

function FinishSessionModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (summary: SessionSummaryInput) => void }) {
  const [effort, setEffort] = useState(7);
  const [soreness, setSoreness] = useState(5);
  const [wellbeing, setWellbeing] = useState(4);
  const [notes, setNotes] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Podsumowanie sesji" size="sm"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={() => onConfirm({ perceived_effort: effort, soreness, wellbeing, notes: notes || null })}>Zapisz i zamknij</button>
      </>}>
      <div className="sport-form">
        <Field label="RPE (1-10)"><input className="input" type="number" min={1} max={10} value={effort} onChange={(e) => setEffort(+e.target.value)} /></Field>
        <Field label="Odczucia (1-10)"><input className="input" type="number" min={1} max={10} value={soreness} onChange={(e) => setSoreness(+e.target.value)} /></Field>
        <Field label="Samopoczucie (1-5)"><input className="input" type="number" min={1} max={5} value={wellbeing} onChange={(e) => setWellbeing(+e.target.value)} /></Field>
        <Field label="Notatki"><textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
