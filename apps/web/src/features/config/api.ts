import { supabase } from '@/lib/supabase';
import { MODULES } from './registry';

export interface ModuleSetting {
  module_key: string;
  visible: boolean;
  sort_order: number;
}

export interface FeatureSetting {
  feature_key: string;
  visible: boolean;
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Brak sesji użytkownika');
  return id;
}

export async function fetchModuleSettings(): Promise<ModuleSetting[]> {
  const { data, error } = await supabase
    .from('user_module_settings')
    .select('module_key, visible, sort_order');
  if (error) throw error;
  return (data ?? []) as ModuleSetting[];
}

export async function fetchFeatureSettings(): Promise<FeatureSetting[]> {
  const { data, error } = await supabase
    .from('user_feature_settings')
    .select('feature_key, visible');
  if (error) throw error;
  return (data ?? []) as FeatureSetting[];
}

type ModuleUpsert = { module_key: string; visible?: boolean; sort_order?: number };

export async function upsertModuleSettings(rows: ModuleUpsert[]): Promise<void> {
  const userId = await uid();
  const payload = rows.map((r) => ({ ...r, user_id: userId }));
  const { error } = await supabase
    .from('user_module_settings')
    .upsert(payload, { onConflict: 'user_id,module_key' });
  if (error) throw error;
}

export async function setFeatureVisible(featureKey: string, visible: boolean): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('user_feature_settings')
    .upsert({ user_id: userId, feature_key: featureKey, visible }, { onConflict: 'user_id,feature_key' });
  if (error) throw error;
}

export async function resetConfig(): Promise<void> {
  const userId = await uid();
  await supabase.from('user_feature_settings').delete().eq('user_id', userId);
  const payload = MODULES.map((m) => ({
    user_id: userId,
    module_key: m.key,
    visible: true,
    sort_order: m.order,
  }));
  const { error } = await supabase
    .from('user_module_settings')
    .upsert(payload, { onConflict: 'user_id,module_key' });
  if (error) throw error;
}
