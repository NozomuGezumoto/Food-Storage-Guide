export const DAY = 86400000;

/** 両端含む範囲の要素数。min=1, max=14 → 14個（1..14）。ずれ防止用。 */
export function inclusiveRangeCount(min: number, max: number): number {
  return Math.max(0, max - min + 1);
}

/** 両端含む範囲に value が入っているか。 */
export function isInInclusiveRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/** Start of the calendar day (00:00:00) in local time for the given timestamp. */
export function startOfDayLocal(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 指定タイムスタンプに days 日を加算（days は負可）。通知の deadlineDate 計算用。 */
export function addDays(ms: number, days: number): number {
  return ms + days * DAY;
}

/** Returns the timestamp for the given calendar day at hour:minute (local time). */
export function setTimeOnDate(dayStartMs: number, hour: number, minute: number): number {
  const d = new Date(dayStartMs);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function calcNotifyAt(purchasedAt: number, notifyDays: number): number {
  return purchasedAt + notifyDays * DAY;
}

/** 登録日から今日まで何日目か（カレンダー日）。表示用。0＝登録日当日。 */
export function getDaysFromRegistration(purchasedAt: number): number {
  const todayStartMs = startOfDayLocal(Date.now());
  const purchaseDayStartMs = startOfDayLocal(purchasedAt);
  return Math.round((todayStartMs - purchaseDayStartMs) / DAY);
}

/**
 * 残り日数（表示・セクション分け用）。
 * 通知判定はカウントダウンではなく「基準日から通知日時を確定して予約」するため、この値で毎日判定はしない。
 */
export function getRemainingDays(notifyAt: number): number {
  const todayStartMs = startOfDayLocal(Date.now());
  const expiryDayStartMs = startOfDayLocal(notifyAt);
  if (expiryDayStartMs < todayStartMs) return 0;
  return Math.round((expiryDayStartMs - todayStartMs) / DAY);
}

export function formatNotifyDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}
