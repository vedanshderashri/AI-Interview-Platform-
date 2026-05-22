import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Participant {
  id: string;
  name: string;
  joinedAt: Date;
}

export interface Meeting {
  id: string;
  code: string;
  createdBy: string;
  title: string;
  description?: string;
  createdAt: Date;
  participants: Participant[];
  maxParticipants?: number;
  isActive: boolean;
}

interface MeetingStore {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  hydrated: boolean;

  createMeeting: (createdBy: string, title: string, description?: string) => Meeting;
  joinMeeting: (code: string, participantName: string) => boolean;
  leaveMeeting: (meetingCode: string, participantId: string) => void;
  getActiveMeetings: () => Meeting[];
  getMeetingByCode: (code: string) => Meeting | null;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  endMeeting: (code: string) => void;
  deleteMeeting: (code: string) => void;
}

// Helper function to generate unique meeting codes
const generateMeetingCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: [],
      currentMeeting: null,
      hydrated: false,

      createMeeting: (createdBy: string, title: string, description?: string) => {
        const code = generateMeetingCode();
        const newMeeting: Meeting = {
          id: `meeting_${Date.now()}`,
          code,
          createdBy,
          title,
          description,
          createdAt: new Date(),
          participants: [
            {
              id: `participant_${Date.now()}`,
              name: createdBy,
              joinedAt: new Date(),
            },
          ],
          maxParticipants: 10,
          isActive: true,
        };

        set((state) => ({
          meetings: [...state.meetings, newMeeting],
          currentMeeting: newMeeting,
        }));

        return newMeeting;
      },

      joinMeeting: (code: string, participantName: string) => {
        const state = get();
        const cleanCode = code.trim().toUpperCase();
        const cleanName = participantName.trim();
        
        // First try current state
        let meeting = state.meetings.find((m) => m.code === cleanCode && m.isActive);
        
        // If not found in current state, check localStorage for latest data
        if (!meeting) {
          try {
            const storedData = localStorage.getItem('meeting-store');
            if (storedData) {
              const parsed = JSON.parse(storedData);
              const latestMeetings = parsed.state?.meetings || [];
              meeting = latestMeetings.find((m: any) => m.code === cleanCode && m.isActive);
              
              if (meeting) {
                // Update state with latest data from localStorage
                set({ meetings: latestMeetings });
              }
            }
          } catch (e) {
            console.error('Failed to load meetings from localStorage:', e);
          }
        }

        if (!meeting) {
          return false;
        }

        if (meeting.maxParticipants && meeting.participants.length >= meeting.maxParticipants) {
          return false;
        }

        // Check if participant already exists
        if (meeting.participants.some((p) => p.name === cleanName)) {
          set({ currentMeeting: meeting });
          return true;
        }

        const newParticipant: Participant = {
          id: `participant_${Date.now()}`,
          name: cleanName,
          joinedAt: new Date(),
        };

        const updatedMeeting = {
          ...meeting,
          participants: [...meeting.participants, newParticipant],
        };

        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.code === cleanCode
              ? updatedMeeting
              : m
          ),
          currentMeeting: updatedMeeting,
        }));

        return true;
      },

      leaveMeeting: (meetingCode: string, participantId: string) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.code === meetingCode
              ? {
                  ...m,
                  participants: m.participants.filter((p) => p.id !== participantId),
                }
              : m
          ),
          currentMeeting:
            state.currentMeeting?.code === meetingCode ? null : state.currentMeeting,
        }));
      },

      getActiveMeetings: () => {
        const state = get();
        return state.meetings.filter((m) => m.isActive);
      },

      getMeetingByCode: (code: string) => {
        const state = get();
        return state.meetings.find((m) => m.code === code) || null;
      },

      setCurrentMeeting: (meeting: Meeting | null) => {
        set({ currentMeeting: meeting });
      },

      endMeeting: (code: string) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.code === code ? { ...m, isActive: false } : m
          ),
          currentMeeting:
            state.currentMeeting?.code === code ? null : state.currentMeeting,
        }));
      },

      deleteMeeting: (code: string) => {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.code !== code),
          currentMeeting:
            state.currentMeeting?.code === code ? null : state.currentMeeting,
        }));
      },
    }),
    {
      name: 'meeting-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
      // Listen for storage changes across tabs/windows
      partialize: (state) => ({
        meetings: state.meetings,
        currentMeeting: state.currentMeeting,
        hydrated: state.hydrated,
      }),
    }
  )
);
