import { Stack } from 'expo-router';
import { t } from '@/utils/i18n';

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: t('common.back') }}>
      <Stack.Screen
        name="index"
        options={{ title: t('search.header.search'), headerShown: false }}
      />
      <Stack.Screen
        name="food/[id]"
        options={{ title: t('search.header.storageGuide') }}
      />
      <Stack.Screen
        name="food/purchase"
        options={{ title: t('search.header.registerPurchase') }}
      />
    </Stack>
  );
}
