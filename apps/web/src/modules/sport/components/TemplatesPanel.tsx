import { useState } from 'react';
import { ModuleCard, ModuleHeader } from '@/components/layout/primitives';
import { ConfirmDelete, EmptyState, MoreMenu } from '@/components/common';
import { toast } from '@/lib/toast';
import {
  useTemplates, useSports, useExercises, useCreateTemplate, useUpdateTemplate,
  useSaveTemplateExercises, useDeleteTemplate, useDuplicateTemplate, useTemplateFull,
} from '@/features/sport/hooks';
import { TemplateEditorModal } from './TemplateEditorModal';
import type { TemplateExerciseInput } from '@/features/sport/services/sportRepository';

interface TemplateFieldsPayload { name: string; sport_id: string | null; subtitle: string | null; estimated_duration_min: number | null; }

export function TemplatesPanel() {
  const { data: templates = [] } = useTemplates();
  const { data: sports = [] } = useSports();
  const { data: exercises = [] } = useExercises();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const saveExercises = useSaveTemplateExercises();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: editingFull } = useTemplateFull(editingId);

  async function handleSave(fields: TemplateFieldsPayload, exercisesPayload: TemplateExerciseInput[]) {
    try {
      const template = editingId
        ? await updateTemplate.mutateAsync({ id: editingId, patch: fields })
        : await createTemplate.mutateAsync({ name: fields.name, sport_id: fields.sport_id, subtitle: fields.subtitle, estimated_duration_min: fields.estimated_duration_min });
      await saveExercises.mutateAsync({ templateId: template.id, exercises: exercisesPayload });
      toast.success('Szablon zapisany');
      setEditingId(null);
      setCreating(false);
    } catch {
      toast.error('Nie udało się zapisać szablonu');
    }
  }

  async function handleDeleteTemplate() {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success('Szablon usunięty');
    } catch {
      toast.error('Nie udało się usunąć szablonu');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <ModuleCard className="sport-panel">
      <ModuleHeader title="Szablony i planowanie" actions={<button className="btn btn-secondary btn-sm" onClick={() => setCreating(true)}>+ Nowy szablon</button>} />
      {templates.length === 0 ? (
        <EmptyState title="Nie masz jeszcze szablonów" desc="Utwórz pierwszy szablon, aby szybciej planować treningi." cta="+ Nowy szablon" onCta={() => setCreating(true)} />
      ) : (
        <div className="sport-template-list">
          {templates.map(t => (
            <div key={t.id} className="sport-template-tile">
              <div>
                <div className="sport-template-tile-name">{t.name}</div>
                {t.subtitle && <div className="sport-template-tile-subtitle">{t.subtitle}{t.estimated_duration_min ? ` · ${t.estimated_duration_min} min` : ''}</div>}
              </div>
              <MoreMenu items={[
                { label: 'Edytuj', onClick: () => setEditingId(t.id) },
                { label: 'Duplikuj', onClick: () => duplicateTemplate.mutate(t.id) },
                { label: 'Usuń', onClick: () => setDeleteId(t.id), danger: true },
              ]} />
            </div>
          ))}
        </div>
      )}

      <TemplateEditorModal
        open={creating} onClose={() => setCreating(false)} sports={sports} exercises={exercises}
        onSave={handleSave}
      />
      <TemplateEditorModal
        open={!!editingId} onClose={() => setEditingId(null)} sports={sports} exercises={exercises}
        existing={editingFull ?? null}
        onSave={handleSave}
      />
      <ConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteTemplate}
        label="ten szablon"
      />
    </ModuleCard>
  );
}
