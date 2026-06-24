import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile, updateProfile, type ProfileUpdate,
  fetchPreferences, updatePreferences, type PreferencesUpdate,
} from './profile';

export const PROFILE_KEY = ['profile'] as const;
export const PREFERENCES_KEY = ['user_preferences_full'] as const;

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(patch),
    onSettled: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function usePreferences() {
  return useQuery({ queryKey: PREFERENCES_KEY, queryFn: fetchPreferences });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: PreferencesUpdate) => updatePreferences(patch),
    onSettled: () => qc.invalidateQueries({ queryKey: PREFERENCES_KEY }),
  });
}
