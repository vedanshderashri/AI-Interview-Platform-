import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  careerGoals?: string;
  targetDomains?: string[];
  experienceLevel?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (details: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const url = '/api/auth/login';
          console.log('[AuthStore] Fetching URL:', url);
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          console.log('[AuthStore] Login response status:', response.status);
          console.log('[AuthStore] Login response content-type:', response.headers.get('content-type'));

          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('[AuthStore] Failed to parse JSON:', responseText.slice(0, 200));
            if (responseText.includes('<!DOCTYPE html>')) {
              throw new Error('Received an HTML response instead of JSON. The API route might be missing or misconfigured.');
            }
            throw new Error('Server returned an invalid response format.');
          }

          if (!response.ok) throw new Error(data.error || 'Login failed');
          
          set({ 
            user: data.user, 
            isAuthenticated: true,
            isOnboarded: data.user.isOnboarded,
            loading: false 
          });
        } catch (error: any) {
          console.error('[AuthStore] Login error:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      signup: async (email, name, password) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });

          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('[AuthStore] Failed to parse JSON (Signup):', responseText.slice(0, 100));
            throw new Error('Server returned an invalid response. Please try again.');
          }

          if (!response.ok) throw new Error(data.error || 'Signup failed');
          
          set({ 
            user: data.user, 
            isAuthenticated: true,
            isOnboarded: false,
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      logout: () => 
        set({ user: null, isAuthenticated: false, isOnboarded: false, error: null }),

      completeOnboarding: async (details) => {
        const { user } = get();
        if (!user) return;
        
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/auth/onboarding', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, ...details }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Onboarding update failed');
          
          set({ 
            user: data.user,
            isOnboarded: true,
            loading: false 
          });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'mockmate-auth-storage',
    }
  )
);
