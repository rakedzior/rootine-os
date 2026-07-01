import type { GoalAction, GoalActionNode } from '../types';
import { countGoalActionProgress } from './goalActionProgress';

function byOrder(a: GoalAction, b: GoalAction) {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt) || a.title.localeCompare(b.title);
}

export function buildGoalActionTree(actions: GoalAction[]): GoalActionNode[] {
  const byParent = new Map<string | null, GoalAction[]>();
  const byId = new Map(actions.map((action) => [action.id, action]));

  for (const action of actions) {
    const parentId = action.parentId && byId.has(action.parentId) ? action.parentId : null;
    const bucket = byParent.get(parentId) ?? [];
    bucket.push(action);
    byParent.set(parentId, bucket);
  }

  for (const bucket of byParent.values()) bucket.sort(byOrder);

  const build = (parentId: string | null, depth: number, path: Set<string>): GoalActionNode[] => {
    const bucket = byParent.get(parentId) ?? [];
    return bucket.flatMap((action) => {
      if (path.has(action.id)) return [];
      const nextPath = new Set(path);
      nextPath.add(action.id);
      const node: GoalActionNode = {
        ...action,
        depth,
        children: build(action.id, depth + 1, nextPath),
        progress: { done: 0, total: 0 },
      };
      node.progress = countGoalActionProgress(node);
      return [node];
    });
  };

  return build(null, 0, new Set());
}

export function getActionBreadcrumb(actionId: string, actionsById: Map<string, GoalAction>): GoalAction[] {
  const path: GoalAction[] = [];
  const visited = new Set<string>();
  let current = actionsById.get(actionId) ?? null;

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.parentId ? actionsById.get(current.parentId) ?? null : null;
  }

  return path;
}

export function canMoveAction(actionId: string, newParentId: string | null, actions: GoalAction[]): boolean {
  if (!newParentId) return true;
  if (actionId === newParentId) return false;
  const byId = new Map(actions.map((action) => [action.id, action]));
  let current = byId.get(newParentId) ?? null;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    if (current.id === actionId) return false;
    visited.add(current.id);
    current = current.parentId ? byId.get(current.parentId) ?? null : null;
  }

  return true;
}
