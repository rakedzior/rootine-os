import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MODULES, ALL_FEATURE_KEYS, type ModuleDef, type ModuleKey } from './registry';
import {
  fetchModuleSettings, fetchFeatureSettings,
  upsertModuleSettings, setFeatureVisible, resetConfig,
} from './api';

/* Config source of truth: Supabase user_module_settings / user_feature_settings.
 * Override model: a missing module row => visible at registry order; a missing
 * feature row => visible. While the queries load we fall back to the registry,
 * so the nav never renders empty. */

export const MODULE_SETTINGS_KEY = ['user_module_settings'] as const;
export const FEATURE_SETTINGS_KEY = ['user_feature_settings'] as const;

export function useModuleSettings() {
  return useQuery({ queryKey: MODULE_SETTINGS_KEY, queryFn: fetchModuleSettings });
}

export function useFeatureSettings() {
  return useQuery({ queryKey: FEATURE_SETTINGS_KEY, queryFn: fetchFeatureSettings });
}

export interface ModuleRow {
  key: ModuleKey;
  label: string;
  path: string;
  order: number;
  visible: boolean;
}

/** All 9 modules in effective order, with visibility flag (for settings). */
export function useAllModulesOrdered(): ModuleRow[] {
  const { data } = useModuleSettings();
  return useMemo(() => {
    const map = new Map((data ?? []).map((s) => [s.module_key, s] as const));
    return MODULES.map((m) => ({
      key: m.key,
      label: m.label,
      path: m.path,
      order: map.get(m.key)?.sort_order ?? m.order,
      visible: map.get(m.key)?.visible ?? true,
    })).sort((a, b) => a.order - b.order);
  }, [data]);
}

/** Visible modules, in order (for nav / routing). */
export function useVisibleModules(): ModuleDef[] {
  const all = useAllModulesOrdered();
  return useMemo(
    () => all.filter((m) => m.visible).map(({ key, label, path, order }) => ({ key, label, path, order })),
    [all],
  );
}

export function useIsModuleVisible(key: ModuleKey): boolean {
  return useVisibleModules().some((m) => m.key === key);
}

export function useIsFeatureVisible(featureKey: string): boolean {
  const { data } = useFeatureSettings();
  const row = (data ?? []).find((f) => f.feature_key === featureKey);
  if (row) return row.visible;
  return ALL_FEATURE_KEYS.includes(featureKey);
}

// ---- mutations ----

export function useSetModuleVisible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, visible }: { key: string; visible: boolean }) =>
      upsertModuleSettings([{ module_key: key, visible }]),
    onSettled: () => qc.invalidateQueries({ queryKey: MODULE_SETTINGS_KEY }),
  });
}

export function useReorderModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedKeys: string[]) =>
      upsertModuleSettings(orderedKeys.map((k, i) => ({ module_key: k, sort_order: i }))),
    onSettled: () => qc.invalidateQueries({ queryKey: MODULE_SETTINGS_KEY }),
  });
}

export function useSetFeatureVisible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ featureKey, visible }: { featureKey: string; visible: boolean }) =>
      setFeatureVisible(featureKey, visible),
    onSettled: () => qc.invalidateQueries({ queryKey: FEATURE_SETTINGS_KEY }),
  });
}

export function useResetConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetConfig(),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: MODULE_SETTINGS_KEY });
      qc.invalidateQueries({ queryKey: FEATURE_SETTINGS_KEY });
    },
  });
}
