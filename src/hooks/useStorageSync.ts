import { useEffect } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

export function useStorageSync() {
  const store = useMeetingStore();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'meeting-store') {
        // Storage changed in another tab, rehydrate
        if (e.newValue) {
          try {
            const newState = JSON.parse(e.newValue).state;
            // Force re-render by updating store
            window.location.reload();
          } catch (error) {
            console.error('Failed to sync storage:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
}
