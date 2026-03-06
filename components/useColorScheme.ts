import { useColorScheme as useColorSchemeCore, Platform } from 'react-native';

/**
 * Web版に合わせてネイティブ（iOS/Android）では常にライトテーマ。
 * 携帯でシステムがダークだと画面全体が黒くなるのを防ぐ。
 */
export const useColorScheme = (): 'light' | 'dark' => {
  if (Platform.OS !== 'web') {
    return 'light';
  }
  const coreScheme = useColorSchemeCore();
  if (coreScheme === 'dark') return 'dark';
  return 'light';
};
