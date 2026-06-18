import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchIntegrations,
  disconnectIntegration,
  fetchCalendarEvents,
  insertCalendarEvent,
  deleteCalendarEvent,
  fetchStravaActivities,
} from './api';
import type { IntegrationProvider, NewCalendarEventInput } from './types';

export function useIntegrations() {
  return useQuery({ queryKey: ['integrations'], queryFn: fetchIntegrations });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: IntegrationProvider) => disconnectIntegration(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar_events', from, to],
    queryFn: () => fetchCalendarEvents(from, to),
    enabled: !!from && !!to,
  });
}

export function useAddCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCalendarEventInput) => insertCalendarEvent(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
  });
}

export function useStravaActivities(limit = 20) {
  return useQuery({
    queryKey: ['strava_activities', limit],
    queryFn: () => fetchStravaActivities(limit),
  });
}
