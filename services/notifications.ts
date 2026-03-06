import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PurchaseItem } from '@/types';
import { startOfDayLocal, setTimeOnDate, addDays } from '@/utils/dateUtils';
import { t, getFoodDisplayNameById } from '@/utils/i18n';

// Foreground: notifications are presented when app is open because we return shouldShowAlert/sound/banner below.
// Background / Screen locked: expo-notifications schedules via native OS; the system delivers and displays the notification
// when the app is in background or device is locked. No extra app code required.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'default';

export type NotificationTime = { hour: number; minute: number };

const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 9, minute: 0 };

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notifications.channelName'),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** 許可済みかだけ確認（ダイアログは出さない）。リスト追加時に「許可してないならスケジュールしない」ために使う。 */
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

const storageLabels: Record<PurchaseItem['storage'], string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

/**
 * 毎日残り日数を判定する方式ではなく、
 * 購入日を基準に期限日を計算し、前日通知と当日通知を1回ずつ予約する。
 *
 * 正しい計算:
 *   deadlineDate = startOfDayLocal(addDays(purchasedAt, notifyDays))
 *   beforeDate   = setTimeOnDate(addDays(deadlineDate, -1), hour, minute)  // 前日
 *   sameDayDate  = setTimeOnDate(deadlineDate, hour, minute)               // 当日
 *
 * 予約条件: 許可あり / 未食べ / deadline >= today の startOfDay / trigger > now（過去なら予約しない）
 */
export async function scheduleForItem(
  item: PurchaseItem,
  time: NotificationTime = DEFAULT_NOTIFICATION_TIME
): Promise<{ dayBefore?: string; onDay?: string } | null> {
  const LOG_PREFIX = '[Notification]';
  const { id: itemId, purchasedAt, notifyDays } = item;

  const deadlineDate = startOfDayLocal(addDays(purchasedAt, notifyDays));
  const beforeDate = setTimeOnDate(addDays(deadlineDate, -1), time.hour, time.minute);
  const sameDayDate = setTimeOnDate(deadlineDate, time.hour, time.minute);

  const nowMs = Date.now();
  const todayStartMs = startOfDayLocal(nowMs);

  console.log(LOG_PREFIX, {
    itemId,
    notificationTime: `${time.hour}:${String(time.minute).padStart(2, '0')}`,
    deadlineDate: new Date(deadlineDate).toISOString(),
    beforeDate: new Date(beforeDate).toISOString(),
    sameDayDate: new Date(sameDayDate).toISOString(),
  });

  const ids: { dayBefore?: string; onDay?: string } = {};

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notifications.channelName'),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (deadlineDate < todayStartMs) {
    console.log(LOG_PREFIX, {
      itemId,
      purchasedAt,
      notifyDays,
      deadlineDate: new Date(deadlineDate).toISOString(),
      beforeDate: new Date(beforeDate).toISOString(),
      sameDayDate: new Date(sameDayDate).toISOString(),
      skipped: 'deadlineDate < today startOfDay',
    });
    return null;
  }

  const displayName = getFoodDisplayNameById(item.foodId, item.foodName);

  if (item.notifyDayBefore) {
    if (beforeDate <= nowMs) {
      console.log(LOG_PREFIX, {
        itemId,
        purchasedAt,
        notifyDays,
        deadlineDate: new Date(deadlineDate).toISOString(),
        beforeDate: new Date(beforeDate).toISOString(),
        sameDayDate: new Date(sameDayDate).toISOString(),
        skipped: 'beforeDate <= now (past)',
      });
    } else {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.title.dayBefore'),
          body: t('notifications.body.template', {
            name: displayName,
            storage: storageLabels[item.storage],
          }),
          data: { type: 'dayBefore', purchaseId: item.id },
        },
        trigger: { date: new Date(beforeDate), channelId: CHANNEL_ID },
      });
      ids.dayBefore = id;
      console.log(LOG_PREFIX, {
        itemId,
        purchasedAt,
        notifyDays,
        deadlineDate: new Date(deadlineDate).toISOString(),
        beforeDate: new Date(beforeDate).toISOString(),
        sameDayDate: new Date(sameDayDate).toISOString(),
        scheduled: 'dayBefore',
      });
    }
  }

  if (item.notifyOnDay) {
    if (sameDayDate <= nowMs) {
      console.log(LOG_PREFIX, {
        itemId,
        purchasedAt,
        notifyDays,
        deadlineDate: new Date(deadlineDate).toISOString(),
        beforeDate: new Date(beforeDate).toISOString(),
        sameDayDate: new Date(sameDayDate).toISOString(),
        skipped: 'sameDayDate <= now (past)',
      });
    } else {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notifications.title.onDay'),
          body: t('notifications.body.template', {
            name: displayName,
            storage: storageLabels[item.storage],
          }),
          data: { type: 'onDay', purchaseId: item.id },
        },
        trigger: { date: new Date(sameDayDate), channelId: CHANNEL_ID },
      });
      ids.onDay = id;
      console.log(LOG_PREFIX, {
        itemId,
        purchasedAt,
        notifyDays,
        deadlineDate: new Date(deadlineDate).toISOString(),
        beforeDate: new Date(beforeDate).toISOString(),
        sameDayDate: new Date(sameDayDate).toISOString(),
        scheduled: 'onDay',
      });
    }
  }

  if (Object.keys(ids).length === 0 && (item.notifyDayBefore || item.notifyOnDay)) {
    console.log(LOG_PREFIX, {
      itemId,
      purchasedAt,
      notifyDays,
      deadlineDate: new Date(deadlineDate).toISOString(),
      beforeDate: new Date(beforeDate).toISOString(),
      sameDayDate: new Date(sameDayDate).toISOString(),
      skipped: 'all triggers in past or switches off',
    });
  }

  return Object.keys(ids).length > 0 ? ids : null;
}

export async function cancelForItem(item: PurchaseItem): Promise<void> {
  const ids = item.notificationIds;
  if (!ids) return;
  if (ids.dayBefore) await Notifications.cancelScheduledNotificationAsync(ids.dayBefore);
  if (ids.onDay) await Notifications.cancelScheduledNotificationAsync(ids.onDay);
}

/** Cancels all scheduled notifications. Use before rescheduling all (e.g. when user changes notification time) so no stale reminder fires. */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleForItem(
  item: PurchaseItem,
  time: NotificationTime = DEFAULT_NOTIFICATION_TIME
): Promise<{ dayBefore?: string; onDay?: string } | null> {
  await cancelForItem(item);
  return scheduleForItem(item, time);
}
