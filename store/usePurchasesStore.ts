import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchaseItem } from '@/types';
import { calcNotifyAt } from '@/utils/dateUtils';
import * as notifications from '@/services/notifications';
import { useNotificationTimeStore } from '@/store/useNotificationTimeStore';

const STORAGE_KEY = 'food-storage-guide-purchases';

function generateId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface PurchasesState {
  items: PurchaseItem[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (item: Omit<PurchaseItem, 'id' | 'notifyAt'>) => Promise<PurchaseItem>;
  remove: (id: string) => Promise<void>;
  /** 食べたとして一覧から外す（履歴には残す） */
  markEaten: (id: string) => Promise<void>;
  update: (id: string, partial: Partial<PurchaseItem>) => Promise<void>;
  /** Reschedule all notifications for active items using current notification time. Call after changing notification time. */
  rescheduleAllNotifications: () => Promise<void>;
}

export const usePurchasesStore = create<PurchasesState>()(
  persist(
    (set, get) => ({
      items: [],
      loaded: false,

      load: async () => {
        set({ loaded: true });
      },

      add: async (item) => {
        console.log('[Store] add が呼ばれました', { foodId: item.foodId, foodName: item.foodName });
        const notifyAt = calcNotifyAt(item.purchasedAt, item.notifyDays);
        const full: PurchaseItem = {
          ...item,
          id: generateId(),
          notifyAt,
        };
        console.log('[Store] set で items に追加', full.id);
        set((s) => ({ items: [...s.items, full] }));
        let ids: { dayBefore?: string; onDay?: string } | null = null;
        try {
          // リスト追加直後に許可ダイアログや通知が出ないよう、許可済みのときだけスケジュールする（許可は設定で取る）
          if (await notifications.hasNotificationPermission()) {
            const time = useNotificationTimeStore.getState();
            ids = await notifications.scheduleForItem(full, { hour: time.hour, minute: time.minute });
          }
          if (ids) {
            set((s) => ({
              items: s.items.map((i) =>
                i.id === full.id ? { ...i, notificationIds: ids! } : i
              ),
            }));
          }
        } catch (e) {
          console.log('[Store] 通知のスケジュールはスキップ（Web等）', e);
          // 通知はスキップ（Web等では未対応）。購入記録は保存済み。
        }
        console.log('[Store] add 完了。return');
        return { ...full, notificationIds: ids ?? undefined };
      },

      remove: async (id: string) => {
        const item = get().items.find((i) => i.id === id);
        if (item?.notificationIds) {
          await notifications.cancelForItem(item);
        }
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      markEaten: async (id: string) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        if (item.notificationIds) {
          await notifications.cancelForItem(item);
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, eatenAt: Date.now() } : i
          ),
        }));
      },

      update: async (id: string, partial: Partial<PurchaseItem>) => {
        const prev = get().items.find((i) => i.id === id);
        if (!prev) return;
        const next: PurchaseItem = {
          ...prev,
          ...partial,
          id: prev.id,
          foodId: prev.foodId,
          foodName: prev.foodName,
          purchasedAt: prev.purchasedAt,
        };
        if (partial.notifyDays !== undefined) {
          next.notifyAt = calcNotifyAt(next.purchasedAt, next.notifyDays);
        }
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? next : i)),
        }));
        const time = useNotificationTimeStore.getState();
        const newIds = await notifications.rescheduleForItem(next, { hour: time.hour, minute: time.minute });
        if (newIds) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === id ? { ...i, notificationIds: newIds } : i
            ),
          }));
        }
      },

      rescheduleAllNotifications: async () => {
        await notifications.cancelAllScheduledNotifications();
        if (!(await notifications.hasNotificationPermission())) {
          console.log('[Notification] rescheduleAllNotifications skipped: no permission');
          return;
        }
        const time = useNotificationTimeStore.getState();
        const items = get().items.filter((i) => !i.eatenAt);
        console.log('[Notification] rescheduleAllNotifications: cancelled all, rescheduling', items.length, 'items');
        for (const item of items) {
          const ids = await notifications.scheduleForItem(item, { hour: time.hour, minute: time.minute });
          set((s) => ({
            items: s.items.map((i) =>
              i.id === item.id ? { ...i, notificationIds: ids ?? undefined } : i
            ),
          }));
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
      // 起動時（ストア復元後）に「指示していない通知」を消し、前日・当日の設定時刻だけ作り直す
      onRehydrateStorage: () => (state) => {
        if (!state?.items?.length) return;
        setTimeout(() => {
          usePurchasesStore.getState().rescheduleAllNotifications();
        }, 100);
      },
    }
  )
);
