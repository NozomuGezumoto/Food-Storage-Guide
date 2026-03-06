import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, SectionList, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import type { PurchaseItem } from '@/types';
import MemoPhotoModal from '@/components/MemoPhotoModal';
import { t, getFoodDisplayNameById } from '@/utils/i18n';

const storageLabels: Record<PurchaseItem['storage'], string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

type HistorySection = { title: string; data: PurchaseItem[] };

export default function HistoryScreen() {
  const { items, load } = usePurchasesStore();
  const [memoPhotoItem, setMemoPhotoItem] = useState<PurchaseItem | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo((): HistorySection[] => {
    const eaten = items
      .filter((i) => i.eatenAt != null)
      .sort((a, b) => (b.eatenAt ?? 0) - (a.eatenAt ?? 0));
    if (eaten.length === 0) return [];
    return [{ title: t('history.section.title'), data: eaten }];
  }, [items]);

  return (
    <>
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('history.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('history.empty.body')}</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader} lightColor="#eee" darkColor="#333">
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const hasMemoOrPhoto = !!(item.memo?.trim() || item.photoUri);
          const displayName = getFoodDisplayNameById(item.foodId, item.foodName);
          return (
            <View style={styles.card} lightColor="#f5f5f5" darkColor="#222">
              <Text style={styles.foodName}>{displayName}</Text>
              <Text style={styles.storage}>{storageLabels[item.storage]}</Text>
              <Text style={styles.eatenDate}>
                {t('history.label.eatenAt')} {formatDate(item.eatenAt!)}
              </Text>
              {hasMemoOrPhoto && (
                <Pressable
                  style={styles.memoPhotoLink}
                  onPress={() => setMemoPhotoItem(item)}
                >
                  <Text style={styles.memoPhotoLinkText}>
                    {t('history.memoPhoto.link')}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
    <MemoPhotoModal
      visible={memoPhotoItem !== null}
      item={memoPhotoItem}
      onClose={() => setMemoPhotoItem(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, opacity: 0.8 },
  sectionHeader: { paddingTop: 16, paddingBottom: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
  },
  foodName: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  storage: { fontSize: 13, opacity: 0.8, marginBottom: 4 },
  eatenDate: { fontSize: 14, opacity: 0.9 },
  memoPhotoLink: { marginTop: 8, paddingVertical: 6, alignSelf: 'flex-start' },
  memoPhotoLinkText: { fontSize: 15, color: '#2f95dc', fontWeight: '500' },
});
