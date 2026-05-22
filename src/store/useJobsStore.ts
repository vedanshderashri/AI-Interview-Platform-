import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Job {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  formatted_relative_time: string;
  job_url: string;
  company_url?: string;
  [key: string]: any;
}

interface JobsState {
  searchResults: Job[];
  alerts: Job[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  searchJobs: (query: string, location: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  markAsRead: () => void;
  clearResults: () => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      searchResults: [],
      alerts: [],
      unreadCount: 0,
      loading: false,
      error: null,

      searchJobs: async (query, location) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
          const data = await response.json();
          
          if (data.error) throw new Error(data.error);
          
          // RapidAPI indeed12 usually returns { hits: Job[], ... }
          const jobs = data.hits || data.results || [];
          set({ searchResults: jobs, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchAlerts: async () => {
        // We don't set global loading for alerts to avoid blocking UI
        try {
          const response = await fetch('/api/jobs/alerts');
          const data = await response.json();
          
          if (data.error) return;

          const newAlerts = data.hits || data.results || [];
          const currentAlerts = get().alerts;
          
          // Simple logic to find truly new jobs (by id)
          const existingIds = new Set(currentAlerts.map(a => a.id));
          const trulyNew = newAlerts.filter((a: Job) => !existingIds.has(a.id));

          if (trulyNew.length > 0) {
            set({ 
              alerts: [...trulyNew, ...currentAlerts].slice(0, 20), 
              unreadCount: get().unreadCount + trulyNew.length 
            });
          }
        } catch (error) {
          console.error('Failed to fetch job alerts:', error);
        }
      },

      markAsRead: () => set({ unreadCount: 0 }),

      clearResults: () => set({ searchResults: [] }),
    }),
    {
      name: 'mockmate-jobs-storage',
    }
  )
);
