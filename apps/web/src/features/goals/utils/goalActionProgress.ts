import type { GoalActionNode } from '../types';

export function countGoalActionProgress(node: GoalActionNode): GoalActionNode['progress'] {
  let total = 0;
  let done = 0;

  function walk(current: GoalActionNode) {
    for (const child of current.children) {
      total += 1;
      if (child.status === 'done') done += 1;
      walk(child);
    }
  }

  walk(node);
  return { done, total };
}

export function getVisualCompletionState(node: GoalActionNode): 'empty' | 'partial' | 'done' {
  if (node.children.length === 0) return node.status === 'done' ? 'done' : 'empty';
  if (node.progress.total > 0 && node.progress.done === node.progress.total) return 'done';
  if (node.progress.done > 0) return 'partial';
  return node.status === 'done' ? 'done' : 'empty';
}
