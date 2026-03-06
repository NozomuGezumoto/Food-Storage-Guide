import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'food-storage-guide-notification-time';

export interface NotificationTime {
  hour: number;
  minute: number;
}

interface NotificationTimeState {
  hour: number;
  minute: number;
  setTime: (hour: number, minute: number) => void;
}

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

export const useNotificationTimeStore = create<NotificationTimeState>()(
  persist(
    (set) => ({
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hour: s.hour, minute: s.minute }),
    }
  )
);

export function getDefaultNotificationTime(): NotificationTime {
  return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
}
