import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, SectionList, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import type { PurchaseItem } from '@/types';
import MemoPhotoModal from '@/components/MemoPhotoModal';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { items, load } = usePurchasesStore();
  const [memoPhotoItem, setMemoPhotoItem] = useState<PurchaseItem | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo((): HistorySection[] => {
    let eaten = items
      .filter((i) => i.eatenAt != null)
      .sort((a, b) => (b.eatenAt ?? 0) - (a.eatenAt ?? 0));
    const q = query.trim().toLowerCase();
    if (q) {
      eaten = eaten.filter((item) => {
        const displayName = getFoodDisplayNameById(item.foodId, item.foodName).toLowerCase();
        const dateStr = formatDate(item.eatenAt!);
        const dateStrNoSlash = dateStr.replace(/\//g, '');
        const qNoSlash = q.replace(/\//g, '');
        return (
          displayName.includes(q) ||
          item.foodName.toLowerCase().includes(q) ||
          dateStr.includes(q) ||
          dateStrNoSlash.includes(qNoSlash)
        );
      });
    }
    if (eaten.length === 0) return [];
    return [{ title: t('history.section.title'), data: eaten }];
  }, [items, query]);

  const hasEatenItems = useMemo(() => items.some((i) => i.eatenAt != null), [items]);
  const isFilteredEmpty = hasEatenItems && sections.length === 0;

  return (
    <>
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.searchRow, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder={t('history.search.placeholder')}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isFilteredEmpty ? t('history.empty.noResults') : t('history.empty.title')}
            </Text>
            <Text style={styles.emptySub}>
              {isFilteredEmpty ? t('history.empty.noResultsHint') : t('history.empty.body')}
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const hasMemoOrPhoto = !!(item.memo?.trim() || item.photoUri);
          const displayName = getFoodDisplayNameById(item.foodId, item.foodName);
          return (
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
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
    </KeyboardAvoidingView>
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
  searchRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, marginBottom: 10 },
  emptySub: { fontSize: 16, opacity: 0.85 },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  card: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  foodName: { fontSize: 21, fontWeight: '700', marginBottom: 6 },
  storage: { fontSize: 15, opacity: 0.85, marginBottom: 6 },
  eatenDate: { fontSize: 15, opacity: 0.9, fontWeight: '500' },
  memoPhotoLink: { marginTop: 10, paddingVertical: 10, alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  memoPhotoLinkText: { fontSize: 16, color: '#0D9488', fontWeight: '500' },
});
