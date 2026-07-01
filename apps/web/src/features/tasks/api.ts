import { supabase } from '@/lib/supabase';
import type { Task, NewTaskInput } from './types';

type PlannerTaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  source: 'manual' | 'quick_add' | 'calendar_quick' | 'drag_drop' | 'imported';
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  due_date: string | null;
  reminder_at: string | null;
  repeat_rule: Record<string, unknown> | null;
  completed_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  sort_order: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const TASK_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'status',
  'priority',
  'source',
  'all_day',
  'start_at',
  'end_at',
  'due_date',
  'reminder_at',
  'repeat_rule',
  'completed_at',
  'archived_at',
  'deleted_at',
  'sort_order',
  'metadata',
  'created_at',
  'updated_at',
].join(', ');

function toPriority(value: PlannerTaskRow['priority']): Task['priority'] {
  if (value === 'high' || value === 'urgent') return 'high';
  if (value === 'medium') return 'mid';
  if (value === 'low') return 'low';
  if (value === 'none') return 'mid';
  return 'mid';
}

function fromPriority(value: NewTaskInput['priority']): PlannerTaskRow['priority'] {
  if (value === 'high') return 'high';
  if (value === 'low') return 'low';
  return 'medium';
}

function parseTimeFromIso(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function combineDateTime(date: string | null | undefined, time: string | null | undefined): string | null {
  if (!date) return null;
  if (!time) return `${date}T00:00:00`;
  return `${date}T${time}:00`;
}

function mapTaskRow(row: PlannerTaskRow, tags: string[]): Task {
  const scheduled = parseTimeFromIso(row.start_at);
  const repeat = row.repeat_rule ?? null;
  const repeatFrequency = repeat && typeof repeat.frequency === 'string'
    ? repeat.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly'
    : null;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    tags,
    done: row.status === 'done',
    source: row.source,
    due_date: row.due_date,
    all_day: row.all_day,
    start_at: row.start_at,
    end_at: row.end_at,
    reminder_at: row.reminder_at,
    category: (row.metadata?.category as string | undefined) ?? null,
    location: (row.metadata?.location as string | undefined) ?? null,
    priority: toPriority(row.priority),
    scheduled_time: scheduled,
    duration_minutes: row.start_at && row.end_at
      ? Math.max(1, Math.round((new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60000))
      : null,
    note: row.description ?? '',
    series_id: (row.metadata?.series_id as string | undefined) ?? null,
    repeat_mode: repeatFrequency ?? 'none',
    repeat_rule: repeat,
    repeat_anchor: (repeat && typeof repeat.anchor === 'string'
      ? (repeat.anchor as 'due_date' | 'completion_date')
      : 'due_date'),
    repeat_until: (repeat && typeof repeat.until === 'string') ? repeat.until : null,
    repeat_weekdays: Array.isArray((repeat as Record<string, unknown>)?.days_of_week)
      ? ((repeat as Record<string, unknown>).days_of_week as unknown[])
        .map((d) => {
          if (typeof d === 'number') return d;
          if (typeof d === 'string') {
            const map: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };
            return map[d.toUpperCase()] ?? null;
          }
          return null;
        })
        .filter((d): d is number => typeof d === 'number')
      : null,
    favorite: Boolean(row.metadata?.favorite),
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  };
}

async function fetchTaskTags(taskIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (taskIds.length === 0) return map;
  const { data, error } = await supabase
    .from('planner_task_tags')
    .select('task_id, planner_tags(name)')
    .in('task_id', taskIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const taskId = (row as { task_id: string }).task_id;
    const tagName = (row as { planner_tags?: { name?: string } | Array<{ name?: string }> }).planner_tags;
    const name = Array.isArray(tagName)
      ? tagName[0]?.name
      : tagName?.name;
    if (!name) continue;
    const current = map.get(taskId) ?? [];
    current.push(name);
    map.set(taskId, current);
  }
  for (const [id, tags] of map.entries()) {
    map.set(id, [...new Set(tags)].sort((a, b) => a.localeCompare(b)));
  }
  return map;
}

async function ensureTagIds(userId: string, tags: string[]): Promise<string[]> {
  if (tags.length === 0) return [];
  const cleaned = [...new Set(tags.map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))];
  if (cleaned.length === 0) return [];

  const { data: existingRows, error: existingErr } = await supabase
    .from('planner_tags')
    .select('id, name')
    .eq('user_id', userId)
    .in('name', cleaned);
  if (existingErr) throw existingErr;

  const existing = new Map((existingRows ?? []).map((row) => [row.name, row.id]));
  const missing = cleaned.filter((name) => !existing.has(name));

  if (missing.length > 0) {
    const { data: insertedRows, error: insertErr } = await supabase
      .from('planner_tags')
      .insert(missing.map((name) => ({ user_id: userId, name })))
      .select('id, name');
    if (insertErr) throw insertErr;
    for (const row of insertedRows ?? []) existing.set(row.name, row.id);
  }

  return cleaned.map((name) => existing.get(name)).filter((id): id is string => !!id);
}

async function syncTaskTags(taskId: string, userId: string, tags: string[] | null | undefined): Promise<void> {
  const tagIds = await ensureTagIds(userId, tags ?? []);
  const { error: delErr } = await supabase.from('planner_task_tags').delete().eq('task_id', taskId);
  if (delErr) throw delErr;
  if (tagIds.length === 0) return;
  const { error: linkErr } = await supabase
    .from('planner_task_tags')
    .insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));
  if (linkErr) throw linkErr;
}

async function syncPrimaryInstance(row: PlannerTaskRow): Promise<void> {
  const { error: purgeErr } = await supabase
    .from('planner_task_instances')
    .delete()
    .eq('task_id', row.id);
  if (purgeErr) throw purgeErr;

  if (!row.due_date || row.deleted_at) return;

  const { error: insertErr } = await supabase
    .from('planner_task_instances')
    .insert({
      user_id: row.user_id,
      task_id: row.id,
      instance_date: row.due_date,
      start_at: row.start_at,
      end_at: row.end_at,
      status: row.status,
      completed_at: row.completed_at,
      is_override: false,
    });
  if (insertErr) throw insertErr;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select<string, PlannerTaskRow>(TASK_COLUMNS)
    .is('deleted_at', null)
    .order('status', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const tagsMap = await fetchTaskTags(rows.map((row) => row.id));
  return rows.map((row) => mapTaskRow(row, tagsMap.get(row.id) ?? []));
}

export async function insertTask(input: NewTaskInput): Promise<Task> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika');

  const startAt = input.start_at ?? combineDateTime(input.due_date, input.scheduled_time ?? null);
  const endAt = input.end_at ?? (input.duration_minutes && startAt
    ? new Date(new Date(startAt).getTime() + input.duration_minutes * 60000).toISOString()
    : null);
  const repeatRule = input.repeat_rule ?? (input.repeat_mode && input.repeat_mode !== 'none'
    ? {
      frequency: input.repeat_mode,
      interval: 1,
      anchor: input.repeat_anchor ?? 'due_date',
      days_of_week: input.repeat_weekdays ?? null,
      until: input.repeat_until ?? null,
    }
    : null);

  const { data, error } = await supabase
    .from('planner_tasks')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.note ?? null,
      status: 'todo',
      source: input.source ?? 'manual',
      priority: fromPriority(input.priority),
      all_day: input.all_day ?? !input.scheduled_time,
      due_date: input.due_date ?? null,
      start_at: startAt,
      end_at: endAt,
      reminder_at: input.reminder_at ?? null,
      repeat_rule: repeatRule,
      metadata: {
        category: input.category ?? null,
        location: input.location ?? null,
        favorite: false,
        series_id: input.series_id ?? null,
      },
    })
    .select<string, PlannerTaskRow>(TASK_COLUMNS)
    .single();
  if (error) throw error;
  if (!data) throw new Error('Nie udało się utworzyć zadania.');

  await syncTaskTags(data.id, userId, input.tags);
  await syncPrimaryInstance(data);

  const tagsMap = await fetchTaskTags([data.id]);
  return mapTaskRow(data, tagsMap.get(data.id) ?? []);
}

export async function patchTask(id: string, patch: Partial<Task>): Promise<Task> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error('Brak sesji użytkownika');

  const updatePayload: Record<string, unknown> = {};
  if (typeof patch.title === 'string') updatePayload.title = patch.title;
  if (typeof patch.done === 'boolean') {
    updatePayload.status = patch.done ? 'done' : 'todo';
    updatePayload.completed_at = patch.done ? new Date().toISOString() : null;
  }
  if (patch.priority) updatePayload.priority = fromPriority(patch.priority);
  if (patch.note !== undefined) updatePayload.description = patch.note ?? null;
  if (patch.due_date !== undefined) updatePayload.due_date = patch.due_date;
  if (patch.source) updatePayload.source = patch.source;
  if (patch.reminder_at !== undefined) updatePayload.reminder_at = patch.reminder_at;
  if (patch.all_day !== undefined) updatePayload.all_day = patch.all_day;
  if (patch.start_at !== undefined) updatePayload.start_at = patch.start_at;
  if (patch.end_at !== undefined) updatePayload.end_at = patch.end_at;

  if (
    patch.scheduled_time !== undefined
    || patch.duration_minutes !== undefined
    || patch.due_date !== undefined
    || patch.start_at !== undefined
    || patch.end_at !== undefined
    || patch.all_day !== undefined
  ) {
    const { data: existing, error: existingErr } = await supabase
      .from('planner_tasks')
      .select('due_date, start_at, end_at, all_day')
      .eq('id', id)
      .single();
    if (existingErr) throw existingErr;

    const baseDate = patch.due_date ?? existing.due_date;
    const isAllDay = patch.all_day ?? existing.all_day ?? false;
    const baseTime = isAllDay
      ? null
      : (patch.scheduled_time !== undefined ? patch.scheduled_time : parseTimeFromIso(existing.start_at));
    const nextStart = patch.start_at ?? combineDateTime(baseDate, baseTime ?? null);
    const duration = patch.duration_minutes ?? (existing.start_at && existing.end_at
      ? Math.max(1, Math.round((new Date(existing.end_at).getTime() - new Date(existing.start_at).getTime()) / 60000))
      : null);
    const nextEnd = patch.end_at ?? (isAllDay
      ? null
      : (nextStart && duration ? new Date(new Date(nextStart).getTime() + duration * 60000).toISOString() : null));
    updatePayload.start_at = nextStart;
    updatePayload.end_at = nextEnd;
    updatePayload.all_day = isAllDay;
  }

  if (patch.repeat_mode !== undefined || patch.repeat_until !== undefined || patch.repeat_weekdays !== undefined || patch.repeat_rule !== undefined || patch.repeat_anchor !== undefined) {
    if (patch.repeat_rule !== undefined) {
      updatePayload.repeat_rule = patch.repeat_rule;
    } else if (!patch.repeat_mode || patch.repeat_mode === 'none') {
      updatePayload.repeat_rule = null;
    } else {
      updatePayload.repeat_rule = {
        frequency: patch.repeat_mode,
        interval: 1,
        anchor: patch.repeat_anchor ?? 'due_date',
        days_of_week: patch.repeat_weekdays ?? null,
        until: patch.repeat_until ?? null,
      };
    }
  }

  if (patch.category !== undefined || patch.location !== undefined || patch.favorite !== undefined || patch.series_id !== undefined) {
    const { data: existing, error: existingErr } = await supabase
      .from('planner_tasks')
      .select('metadata')
      .eq('id', id)
      .single();
    if (existingErr) throw existingErr;
    const metadata = ((existing.metadata ?? {}) as Record<string, unknown>);
    if (patch.category !== undefined) metadata.category = patch.category;
    if (patch.location !== undefined) metadata.location = patch.location;
    if (patch.favorite !== undefined) metadata.favorite = patch.favorite;
    if (patch.series_id !== undefined) metadata.series_id = patch.series_id;
    updatePayload.metadata = metadata;
  }

  const { data, error } = await supabase
    .from('planner_tasks')
    .update(updatePayload)
    .eq('id', id)
    .select<string, PlannerTaskRow>(TASK_COLUMNS)
    .single();
  if (error) throw error;
  if (!data) throw new Error('Nie udało się zaktualizować zadania.');

  if (patch.tags !== undefined) await syncTaskTags(id, userId, patch.tags);
  await syncPrimaryInstance(data);

  const tagsMap = await fetchTaskTags([id]);
  return mapTaskRow(data, tagsMap.get(id) ?? []);
}

export async function deleteTask(id: string): Promise<void> {
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from('planner_tasks')
    .update({ deleted_at: deletedAt })
    .eq('id', id);
  if (error) throw error;

  const { error: instanceErr } = await supabase
    .from('planner_task_instances')
    .update({ deleted_at: deletedAt })
    .eq('task_id', id);
  if (instanceErr) throw instanceErr;
}

export async function deleteTasks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from('planner_tasks')
    .update({ deleted_at: deletedAt })
    .in('id', ids);
  if (error) throw error;

  const { error: instanceErr } = await supabase
    .from('planner_task_instances')
    .update({ deleted_at: deletedAt })
    .in('task_id', ids);
  if (instanceErr) throw instanceErr;
}
