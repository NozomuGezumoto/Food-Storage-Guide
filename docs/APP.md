# Food Storage Guide — App Documentation

A mobile app that displays storage guidelines for food items and helps users manage expiration dates with purchase registration and notifications.

## Overview

- **Platform**: iOS, Android, Web (Expo / React Native)
- **Data**: Local-only (Zustand + AsyncStorage), no server required
- **Languages**: English, Japanese (via expo-localization)

## Features

### List (Home)

- **Sections by urgency**:
  - **Today (0)**: Expired or expiring today
  - **Eat soon (1)**: Expires tomorrow
  - **Coming up (2–6)**: 2–6 days left
  - **Plenty of time (7+)**: 7+ days left

- **Visual gauge**: Progress bar showing remaining days (10 days = full width)
- **Swipe actions** (native): Left swipe reveals **Ate it** and **Edit**
- **Full swipe**: Swiping fully left auto-executes "Ate it" (moves to history)
- **FAB (+ button)**: Opens frequently-used items for quick registration
- **Midnight refresh**: List updates at 0:00 when the app is open
- **Celebration banner**: "You're all good! No food expiring today." when Today has 0 items

### Search

- Search by name (English / Japanese)
- Category filters
- **Frequent** section: Items purchased before, sorted by count
- Tap item → Food detail → Purchase

### Food Detail

- Storage options, storage time range, tips
- **Purchase** button → Purchase modal or purchase screen

### Purchase Flow

- Storage location (Fridge / Freezer / Room temp)
- Notify days (days from registration to expiry)
- Day-before and on-day notification toggles
- Optional memo and photo

### Edit

- Change notify days, memo, photo
- Accessible via swipe or card button (web)

### History

- Items marked as "Ate it"
- Search by food name or date

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo (React Native) |
| Routing | expo-router |
| State | Zustand + persist (AsyncStorage) |
| Notifications | expo-notifications |
| Gestures | react-native-gesture-handler |
| i18n | expo-localization + custom `utils/i18n.ts` |

### Key Paths

| Path | Description |
|------|-------------|
| `app/(tabs)/home.tsx` | List screen |
| `app/(tabs)/search/index.tsx` | Search screen |
| `app/(tabs)/search/food/[id].tsx` | Food detail |
| `app/(tabs)/search/food/purchase.tsx` | Purchase screen |
| `app/(tabs)/history.tsx` | History screen |
| `store/usePurchasesStore.ts` | Purchase state |
| `data/foods.ts` | Food master data |
| `utils/dateUtils.ts` | Date calculations |
| `utils/i18n.ts` | Translations |
| `components/PurchaseModal.tsx` | Purchase modal |
| `components/EditModal.tsx` | Edit modal |
| `components/FrequentAddModal.tsx` | Quick-add from frequent items |

### Date Logic

- **Remaining days**: `getRemainingDays(notifyAt)` = calendar days from today to expiry
- **Refresh triggers**:
  - App returns to foreground (AppState)
  - Tab becomes visible (Web visibilitychange)
  - Timer at local midnight (0:00)

### Notifications

- **Scheduling**: One day-before and one on-day notification per item
- **Time**: User-configurable in Settings
- **Reschedule**: On notify-days change, notification-time change, or app launch (after rehydration)

See `docs/NOTIFICATIONS.md` for details.

## Data Model

### PurchaseItem

```ts
{
  id: string;
  foodId: string;
  foodName: string;
  storage: 'fridge' | 'freezer' | 'room';
  purchasedAt: number;      // timestamp
  notifyDays: number;       // days until expiry
  notifyAt: number;         // calculated expiry timestamp
  notifyDayBefore: boolean;
  notifyOnDay: boolean;
  eatenAt?: number;         // set when "Ate it"
  memo?: string;
  photoUri?: string;
}
```

### FoodMaster

Defined in `data/foods.ts`: id, name, nameJa, category, storage options, default storage, range days by storage, tips, etc.

## Disclaimer

Storage times are guidelines only. Actual shelf life depends on conditions and freshness. Package use-by dates take precedence when available.
