/**
 * 検索タブへ戻る（Web / ネイティブで同じ挙動にする）
 */
import { Platform } from 'react-native';
import type { Router } from 'expo-router';

export function goToSearch(router: Router): void {
  const path = Platform.OS === 'web' ? '/search' : '/(tabs)/search';
  console.log('[Nav] goToSearch を呼びます', { platform: Platform.OS, path });
  if (Platform.OS === 'web') {
    router.replace('/search' as any);
  } else {
    router.replace('/(tabs)/search' as any);
  }
}
