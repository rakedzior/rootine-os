import { useMemo } from 'react';
import { MODULES, FEATURES, type ModuleDef, type ModuleKey } from './registry';

/* Config access hooks.
 * Phase 0: defaults from the registry (everything visible, default order).
 * Phase 1 (c1.8): these read user_module_settings / user_feature_settings
 * from Supabase (cached per device) instead of the static registry. The
 * component API stays identical so screens don't change. */

export function useVisibleModules(): ModuleDef[] {
  return useMemo(() => [...MODULES].sort((a, b) => a.order - b.order), []);
}

export function useIsModuleVisible(key: ModuleKey): boolean {
  return useVisibleModules().some((m) => m.key === key);
}

/** Whether a given feature_key should render. Defaults to true in Phase 0. */
export function useIsFeatureVisible(featureKey: string): boolean {
  // Phase 1 wires real per-user visibility here.
  return useMemo(() => {
    const known = Object.values(FEATURES)
      .flat()
      .some((f) => f.key === featureKey);
    return known; // unknown keys hidden by default
  }, [featureKey]);
}
