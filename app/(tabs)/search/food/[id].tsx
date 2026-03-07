import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getFoodById } from '@/data/foods';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { t, getFoodDisplayName } from '@/utils/i18n';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const storageLabels = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
} as const;

function formatRange(r: { min: number; max: number } | undefined): string {
  if (!r) return '—';
  return t('food.range.format', { min: r.min, max: r.max });
}

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const items = usePurchasesStore((s) => s.items);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const food = id ? getFoodById(id) : null;
  const alreadyInList = food ? items.some((p) => !p.eatenAt && p.foodId === food.id) : false;

  if (!food) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{t('food.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const rangeFridge = food.rangeDaysByStorage.fridge;
  const rangeFreezer = food.rangeDaysByStorage.freezer;
  const rangeRoom = food.rangeDaysByStorage.room;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{getFoodDisplayName(food)}</Text>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('food.storage.title')}</Text>
        <Text style={[styles.body, { color: colors.text }]}>
          {food.storageOptions.map((s) => storageLabels[s]).join(' / ')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('food.storageTime.title')}</Text>
        {rangeFridge && (
          <Text style={[styles.body, { color: colors.text }]}>
            {t('common.storage.fridge')}: {formatRange(rangeFridge)}
          </Text>
        )}
        {rangeFreezer && (
          <Text style={[styles.body, { color: colors.text }]}>
            {t('common.storage.freezer')}: {formatRange(rangeFreezer)}
          </Text>
        )}
        {rangeRoom && (
          <Text style={[styles.body, { color: colors.text }]}>
            {t('common.storage.room')}: {formatRange(rangeRoom)}
          </Text>
        )}
      </View>

      {food.tips.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('food.tips.title')}</Text>
          {food.tips.map((tip, i) => (
            <Text key={i} style={[styles.body, { color: colors.text }]}>• {tip}</Text>
          ))}
        </View>
      )}

      <Link href={`/search/food/purchase?id=${food.id}`} asChild>
        <Pressable style={[styles.purchaseBtn, { backgroundColor: colors.tint }]}>
          <Text style={styles.purchaseBtnText}>
            {alreadyInList ? t('food.purchase.buttonAgain') : t('food.purchase.button')}
          </Text>
        </Pressable>
      </Link>
      {alreadyInList && (
        <Text style={[styles.duplicateHint, { color: colors.tint }]}>{t('food.purchase.duplicateHint')}</Text>
      )}

      <View style={styles.disclaimer} lightColor="#FEF3C7" darkColor="#3A3520">
        <Text style={styles.disclaimerText}>
          {t('food.disclaimer.main')}
        </Text>
        <Text style={styles.disclaimerEn}>
          {t('food.disclaimer.extra')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 36 },
  error: { padding: 16 },
  link: { color: '#0D9488', padding: 18 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  body: { fontSize: 16, marginBottom: 6, lineHeight: 24 },
  purchaseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 48,
  },
  purchaseBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  duplicateHint: {
    fontSize: 14,
    color: '#0D9488',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  disclaimer: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  disclaimerText: { fontSize: 15, marginBottom: 8 },
  disclaimerEn: { fontSize: 14, opacity: 0.85 },
});
