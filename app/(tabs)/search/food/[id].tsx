import React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getFoodById } from '@/data/foods';
import { t, getFoodDisplayName } from '@/utils/i18n';

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

  const food = id ? getFoodById(id) : null;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{getFoodDisplayName(food)}</Text>

      <View style={styles.section} lightColor="#f8f8f8" darkColor="#1a1a1a">
        <Text style={styles.sectionTitle}>{t('food.storage.title')}</Text>
        <Text style={styles.body}>
          {food.storageOptions.map((s) => storageLabels[s]).join(' / ')}
        </Text>
      </View>

      <View style={styles.section} lightColor="#f8f8f8" darkColor="#1a1a1a">
        <Text style={styles.sectionTitle}>{t('food.storageTime.title')}</Text>
        {rangeFridge && (
          <Text style={styles.body}>
            {t('common.storage.fridge')}: {formatRange(rangeFridge)}
          </Text>
        )}
        {rangeFreezer && (
          <Text style={styles.body}>
            {t('common.storage.freezer')}: {formatRange(rangeFreezer)}
          </Text>
        )}
        {rangeRoom && (
          <Text style={styles.body}>
            {t('common.storage.room')}: {formatRange(rangeRoom)}
          </Text>
        )}
      </View>

      {food.tips.length > 0 && (
        <View style={styles.section} lightColor="#f8f8f8" darkColor="#1a1a1a">
          <Text style={styles.sectionTitle}>{t('food.tips.title')}</Text>
          {food.tips.map((tip, i) => (
            <Text key={i} style={styles.body}>• {tip}</Text>
          ))}
        </View>
      )}

      <Link href={`/search/food/purchase?id=${food.id}`} asChild>
        <Pressable style={styles.purchaseBtn}>
          <Text style={styles.purchaseBtnText}>{t('food.purchase.button')}</Text>
        </Pressable>
      </Link>

      <View style={styles.disclaimer} lightColor="#fff8e1" darkColor="#3a3520">
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
  content: { padding: 16, paddingBottom: 32 },
  error: { padding: 16 },
  link: { color: '#2f95dc', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  section: { padding: 14, borderRadius: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, opacity: 0.9 },
  body: { fontSize: 15, marginBottom: 4, lineHeight: 22 },
  purchaseBtn: {
    backgroundColor: '#2f95dc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  purchaseBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  disclaimer: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  disclaimerText: { fontSize: 13, marginBottom: 6 },
  disclaimerEn: { fontSize: 12, opacity: 0.85 },
});
