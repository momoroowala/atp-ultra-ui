import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { generateRecurringDates, generateRecurringDatesByCount } from '@/utils/dateHelpers';
import { format, addYears } from 'date-fns';

const syncToGoogleCalendar = async (action: 'create' | 'update' | 'delete', call: any): Promise<{ gcEventId: string | null; meetLink: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
      body: { action, call },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return { gcEventId: data.google_calendar_event_id || null, meetLink: data.meetLink || null };
  } catch (err: any) {
    console.warn(`Google Calendar sync (${action}) failed:`, err.message);
    toast.warning('Call saved, but Google Calendar sync failed');
    return { gcEventId: null, meetLink: null };
  }
};

export interface CalendarCall {
  id: string;
  title: string;
  description: string | null;
  call_date: string;
  call_time: string;
  timezone: string;
  call_link: string;
  is_recurring: boolean;
  recurrence_pattern: any;
  created_by: string;
  is_active: boolean;
  visible_tiers: string[] | null;
  visible_tier_ids: string[] | null;
  series_id: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

// Singleton subscription manager
let callsSubscription: RealtimeChannel | null = null;
let subscriberCount = 0;
let globalQueryClient: QueryClient | null = null;

const QUERY_KEY = ['calendar-calls'];

const setupRealtimeSubscription = (queryClient: QueryClient) => {
  if (callsSubscription) return;

  callsSubscription = supabase
    .channel('calendar_calls_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calendar_calls',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    )
    .subscribe();
};

const cleanupRealtimeSubscription = () => {
  if (callsSubscription && subscriberCount === 0) {
    supabase.removeChannel(callsSubscription);
    callsSubscription = null;
  }
};

export const useCalendarCalls = () => {
  const queryClient = useQueryClient();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!isSubscribed.current) {
      subscriberCount++;
      globalQueryClient = queryClient;
      setupRealtimeSubscription(queryClient);
      isSubscribed.current = true;
    }

    return () => {
      if (isSubscribed.current) {
        subscriberCount--;
        isSubscribed.current = false;
        setTimeout(cleanupRealtimeSubscription, 1000);
      }
    };
  }, [queryClient]);

  const { data: calls = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      // Fetch 1 day earlier to handle timezone edge cases (e.g., 1:30 AM EST = 10:30 PM PST previous day)
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('calendar_calls')
        .select('*')
        .eq('is_active', true)
        .gte('call_date', yesterday)
        .order('call_date', { ascending: true })
        .order('call_time', { ascending: true });

      if (error) throw error;
      return data as CalendarCall[];
    },
  });

  const createCall = useMutation({
    mutationFn: async (newCall: Omit<CalendarCall, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'series_id' | 'google_calendar_event_id'> & { 
      recurrence_end_type?: 'never' | 'on' | 'after';
      recurrence_end_date?: string;
      occurrence_count?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Handle recurring calls
      if (newCall.is_recurring && newCall.recurrence_pattern && newCall.recurrence_end_type) {
        let dates: string[] = [];
        
        if (newCall.recurrence_end_type === 'never') {
          // Generate recurring calls for 1 year as default
          const oneYearFromNow = format(addYears(new Date(newCall.call_date), 1), 'yyyy-MM-dd');
          dates = generateRecurringDates(
            newCall.call_date,
            oneYearFromNow,
            newCall.recurrence_pattern.type as 'daily' | 'weekly' | 'biweekly'
          );
        } else if (newCall.recurrence_end_type === 'on' && newCall.recurrence_end_date) {
          // Generate recurring calls until end date
          dates = generateRecurringDates(
            newCall.call_date,
            newCall.recurrence_end_date,
            newCall.recurrence_pattern.type as 'daily' | 'weekly' | 'biweekly'
          );
        } else if (newCall.recurrence_end_type === 'after' && newCall.occurrence_count) {
          // Generate exactly N occurrences
          dates = generateRecurringDatesByCount(
            newCall.call_date,
            newCall.recurrence_pattern.type as 'daily' | 'weekly' | 'biweekly',
            newCall.occurrence_count
          );
        }
        
        // Generate a unique series_id for this recurring series
        const seriesId = crypto.randomUUID();
        
        const callsToInsert = dates.map(date => ({
          title: newCall.title,
          description: newCall.description,
          call_date: date,
          call_time: newCall.call_time,
          timezone: newCall.timezone,
          call_link: newCall.call_link,
          is_recurring: false,
          recurrence_pattern: null,
          visible_tiers: newCall.visible_tiers,
          is_active: newCall.is_active,
          created_by: user.id,
          series_id: seriesId,
        }));

        const { data: insertedCalls, error } = await supabase.from('calendar_calls').insert(callsToInsert).select();
        if (error) throw error;
        
        // Sync each call to Google Calendar (non-blocking)
        if (insertedCalls) {
          for (const call of insertedCalls) {
            syncToGoogleCalendar('create', call).then(({ gcEventId, meetLink }) => {
              const updates: any = {};
              if (gcEventId) updates.google_calendar_event_id = gcEventId;
              if (meetLink) updates.call_link = meetLink;
              if (Object.keys(updates).length > 0) {
                supabase.from('calendar_calls').update(updates).eq('id', call.id).then(() => {});
              }
            });
          }
        }
        
        toast.success(`Created ${dates.length} recurring calls`);
      } else {
        const { recurrence_end_type, recurrence_end_date, occurrence_count, ...callData } = newCall;
        const { data: insertedCall, error } = await supabase.from('calendar_calls').insert({
          ...callData,
          created_by: user.id,
          series_id: null,
        }).select().single();
        if (error) throw error;
        
        // Sync to Google Calendar (non-blocking)
        if (insertedCall) {
          syncToGoogleCalendar('create', insertedCall).then(({ gcEventId, meetLink }) => {
            const updates: any = {};
            if (gcEventId) updates.google_calendar_event_id = gcEventId;
            if (meetLink) updates.call_link = meetLink;
            if (Object.keys(updates).length > 0) {
              supabase.from('calendar_calls').update(updates).eq('id', insertedCall.id).then(() => {});
            }
          });
        }
        
        toast.success('Call created successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create call: ${error.message}`);
    },
  });

  const updateCall = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarCall> }) => {
      const { data: updatedCall, error } = await supabase
        .from('calendar_calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Sync to Google Calendar (non-blocking)
      if (updatedCall) {
        syncToGoogleCalendar('update', updatedCall).then(({ meetLink }) => {
          if (meetLink && meetLink !== updatedCall.call_link) {
            supabase.from('calendar_calls').update({ call_link: meetLink } as any).eq('id', id).then(() => {});
          }
        });
      }
      
      toast.success('Call updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update call: ${error.message}`);
    },
  });

  const deleteCall = useMutation({
    mutationFn: async (id: string) => {
      // Fetch the call first to get google_calendar_event_id
      const { data: callToDelete } = await supabase
        .from('calendar_calls')
        .select('google_calendar_event_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('calendar_calls')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Sync delete to Google Calendar (non-blocking)
      if (callToDelete?.google_calendar_event_id) {
        syncToGoogleCalendar('delete', callToDelete);
      }
      
      toast.success('Call deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete call: ${error.message}`);
    },
  });

  const updateCallSeries = useMutation({
    mutationFn: async ({ seriesId, updates }: { seriesId: string; updates: Partial<CalendarCall> }) => {
      // Only allow updating certain fields for the entire series (not call_date to avoid complexity)
      const allowedFields: Partial<CalendarCall> = {};
      if (updates.title !== undefined) allowedFields.title = updates.title;
      if (updates.description !== undefined) allowedFields.description = updates.description;
      if (updates.call_time !== undefined) allowedFields.call_time = updates.call_time;
      if (updates.timezone !== undefined) allowedFields.timezone = updates.timezone;
      if (updates.call_link !== undefined) allowedFields.call_link = updates.call_link;
      if (updates.visible_tiers !== undefined) allowedFields.visible_tiers = updates.visible_tiers;

      const { data: updatedCalls, error } = await supabase
        .from('calendar_calls')
        .update(allowedFields)
        .eq('series_id', seriesId)
        .select();

      if (error) throw error;
      
      // Sync updates to Google Calendar (non-blocking)
      if (updatedCalls) {
        for (const call of updatedCalls) {
          if (call.google_calendar_event_id) {
            syncToGoogleCalendar('update', call);
          }
        }
      }
      
      toast.success('All calls in series updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update call series: ${error.message}`);
    },
  });

  const deleteCallSeries = useMutation({
    mutationFn: async (seriesId: string) => {
      // Fetch all calls in series to get google_calendar_event_ids
      const { data: callsToDelete } = await supabase
        .from('calendar_calls')
        .select('id, google_calendar_event_id')
        .eq('series_id', seriesId);

      const { error } = await supabase
        .from('calendar_calls')
        .delete()
        .eq('series_id', seriesId);

      if (error) throw error;
      
      // Sync deletes to Google Calendar sequentially with delay to avoid rate limits
      if (callsToDelete) {
        for (const call of callsToDelete) {
          if (call.google_calendar_event_id) {
            await syncToGoogleCalendar('delete', call);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }
      
      toast.success('All calls in series deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete call series: ${error.message}`);
    },
  });

  return {
    calls,
    isLoading,
    createCall: createCall.mutate,
    updateCall: updateCall.mutate,
    updateCallSeries: updateCallSeries.mutate,
    deleteCall: deleteCall.mutate,
    deleteCallSeries: deleteCallSeries.mutate,
    refetch,
  };
};
