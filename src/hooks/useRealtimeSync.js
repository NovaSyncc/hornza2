'use client';
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for real-time synchronization across dashboards
 * Subscribes to database changes and triggers refresh callbacks
 */
export const useRealtimeSync = ({
  onBuildingsChange,
  onApartmentsChange,
  onVerificationRequestsChange
}) => {

  // Debounce timers
  const buildingsTimer = useRef(null);
  const apartmentsTimer = useRef(null);
  const verificationsTimer = useRef(null);

  // Debounced callback wrappers (500ms delay)
  const debouncedBuildingsChange = useCallback((payload) => {
    if (buildingsTimer.current) clearTimeout(buildingsTimer.current);
    buildingsTimer.current = setTimeout(() => {
      console.log('Buildings changed (debounced):', payload);
      onBuildingsChange?.(payload);
    }, 500);
  }, [onBuildingsChange]);

  const debouncedApartmentsChange = useCallback((payload) => {
    if (apartmentsTimer.current) clearTimeout(apartmentsTimer.current);
    apartmentsTimer.current = setTimeout(() => {
      console.log('Apartments changed (debounced):', payload);
      onApartmentsChange?.(payload);
    }, 500);
  }, [onApartmentsChange]);

  const debouncedVerificationsChange = useCallback((payload) => {
    if (verificationsTimer.current) clearTimeout(verificationsTimer.current);
    verificationsTimer.current = setTimeout(() => {
      console.log('Verification requests changed (debounced):', payload);
      onVerificationRequestsChange?.(payload);
    }, 500);
  }, [onVerificationRequestsChange]);

  const setupRealtimeSubscriptions = useCallback(() => {
    const subscriptions = [];

    // Subscribe to buildings changes
    if (onBuildingsChange) {
      const buildingsChannel = supabase
        .channel('buildings_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buildings'
          },
          debouncedBuildingsChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Buildings real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Buildings subscription failed');
          }
        });

      subscriptions.push(buildingsChannel);
    }

    // Subscribe to apartments changes
    if (onApartmentsChange) {
      const apartmentsChannel = supabase
        .channel('apartments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'apartments'
          },
          debouncedApartmentsChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Apartments real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Apartments subscription failed');
          }
        });

      subscriptions.push(apartmentsChannel);
    }

    // Subscribe to verification requests changes
    if (onVerificationRequestsChange) {
      const verificationsChannel = supabase
        .channel('verifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'verification_requests'
          },
          debouncedVerificationsChange
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Verification requests real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Verification requests subscription failed');
          }
        });

      subscriptions.push(verificationsChannel);
    }

    // Cleanup function
    return () => {
      // Clear any pending debounce timers
      if (buildingsTimer.current) clearTimeout(buildingsTimer.current);
      if (apartmentsTimer.current) clearTimeout(apartmentsTimer.current);
      if (verificationsTimer.current) clearTimeout(verificationsTimer.current);

      // Unsubscribe from channels
      subscriptions.forEach(channel => {
        supabase.removeChannel(channel);
      });
      console.log('🔌 Real-time subscriptions cleaned up');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBuildingsChange, debouncedApartmentsChange, debouncedVerificationsChange]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [setupRealtimeSubscriptions]);
};

export default useRealtimeSync;
