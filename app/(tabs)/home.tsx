import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, SectionList, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { getRemainingDays } from '@/utils/dateUtils';
import type { PurchaseItem } from '@/types';
import EditModal from '@/components/EditModal';
import MemoPhotoModal from '@/components/MemoPhotoModal';
import { t, getFoodDisplayNameById } from '@/utils/i18n';

const storageLabels: Record<PurchaseItem['storage'], string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

type ItemWithRemaining = PurchaseItem & { remaining: number };

const isNative = Platform.OS !== 'web';

const SECTION_TODAY = t('home.section.today');
const SECTION_SOON = t('home.section.soon');
const SECTION_LATER = t('home.section.later');

type Section = { title: string; data: ItemWithRemaining[]; rangeLabel: string };

function buildSections(items: PurchaseItem[]): Section[] {
  const withRemaining: ItemWithRemaining[] = items.map((item) => ({
    ...item,
    remaining: getRemainingDays(item.notifyAt),
  }));
  const today = withRemaining.filter((i) => i.remaining <= 1).sort((a, b) => a.notifyAt - b.notifyAt);
  const soon = withRemaining
    .filter((i) => i.remaining >= 2 && i.remaining <= 6)
    .sort((a, b) => a.notifyAt - b.notifyAt);
  const later = withRemaining.filter((i) => i.remaining >= 7).sort((a, b) => a.notifyAt - b.notifyAt);

  const sections: Section[] = [];
  if (today.length > 0) {
    sections.push({
      title: SECTION_TODAY,
      data: today,
      rangeLabel: t('home.range.today'),
    });
  }
  if (soon.length > 0) {
    sections.push({
      title: SECTION_SOON,
      data: soon,
      rangeLabel: t('home.range.soon'),
    });
  }
  if (later.length > 0) {
    sections.push({
      title: SECTION_LATER,
      data: later,
      rangeLabel: t('home.range.later'),
    });
  }
  return sections;
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, load, markEaten, update } = usePurchasesStore();
  const activeItems = useMemo(() => items.filter((i) => !i.eatenAt), [items]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memoPhotoItem, setMemoPhotoItem] = useState<PurchaseItem | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => buildSections(activeItems), [activeItems]);

  const handleEaten = (item: PurchaseItem) => {
    const displayName = getFoodDisplayNameById(item.foodId, item.foodName);
    const message = t('home.eaten.alertMessage', { name: displayName });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        markEaten(item.id);
      }
      return;
    }
    Alert.alert(t('home.eaten.alertTitle'), message, [
      { text: t('home.eaten.alertCancel'), style: 'cancel' },
      { text: t('home.eaten.alertRemove'), style: 'destructive', onPress: () => markEaten(item.id) },
    ]);
  };

  const handleSaveEdit = async (
    id: string,
    data: { notifyDays: number; memo?: string; photoUri?: string }
  ) => {
    await update(id, data);
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('home.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('home.empty.body')}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader} lightColor="#eee" darkColor="#333">
            <Text style={styles.sectionTitle}>
              {section.title}　{section.rangeLabel}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const remaining = item.remaining;
          const hasMemoOrPhoto = !!(item.memo?.trim() || item.photoUri);
          const displayName = getFoodDisplayNameById(item.foodId, item.foodName);
          return (
            <View style={styles.card} lightColor="#f5f5f5" darkColor="#222">
              {isNative ? (
                <>
                  <View style={styles.cardRow}>
                    <Text style={styles.foodNameCompact} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={remaining <= 1 ? styles.remainingUrgentCompact : styles.remainingCompact}>
                      {t('home.expiryFromReg', { days: item.notifyDays })}
                      {remaining === 0
                        ? ` · ${t('home.remaining.expired')}`
                        : ` · ${t('home.remaining.daysLeft', { days: remaining })}`}
                    </Text>
                  </View>
                  <View style={[styles.cardRow, styles.cardRowSecondary]}>
                    <Text style={styles.storageCompact}>{storageLabels[item.storage]}</Text>
                    {hasMemoOrPhoto && (
                      <Pressable
                        style={styles.memoPhotoLinkCompact}
                        onPress={() => setMemoPhotoItem(item)}
                      >
                        <Text style={styles.memoPhotoLinkTextCompact}>
                          {t('home.memoPhoto.link.compact')}
                        </Text>
                      </Pressable>
                    )}
                    <View style={styles.actionsCompact}>
                      <Pressable style={styles.editBtnCompact} onPress={() => setEditingId(item.id)}>
                        <Text style={styles.editBtnTextCompact}>{t('home.actions.edit')}</Text>
                      </Pressable>
                      <Pressable style={styles.eatenBtnCompact} onPress={() => handleEaten(item)}>
                        <Text style={styles.eatenBtnTextCompact}>{t('home.actions.eaten')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardMain}>
                    <Text style={styles.foodName}>{displayName}</Text>
                    <Text style={styles.storage}>{storageLabels[item.storage]}</Text>
                    <Text style={remaining <= 1 ? styles.remainingUrgent : styles.remaining}>
                      {t('home.expiryFromReg', { days: item.notifyDays })}
                      {remaining === 0
                        ? ` · ${t('home.remaining.expired')}`
                        : ` · ${t('home.remaining.daysLeft', { days: remaining })}`}
                    </Text>
                    {hasMemoOrPhoto && (
                      <Pressable
                        style={styles.memoPhotoLink}
                        onPress={() => setMemoPhotoItem(item)}
                      >
                        <Text style={styles.memoPhotoLinkText}>
                          {t('home.memoPhoto.link.full')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.editBtn}
                      onPress={() => setEditingId(item.id)}
                    >
                  <Text style={styles.editBtnText}>{t('home.actions.edit')}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.eatenBtn}
                      onPress={() => handleEaten(item)}
                    >
                  <Text style={styles.eatenBtnText}>{t('home.actions.eaten')}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />
      <EditModal
        visible={editingId !== null}
        purchaseItem={editingId ? activeItems.find((i) => i.id === editingId) ?? null : null}
        onClose={() => setEditingId(null)}
        onSave={handleSaveEdit}
      />
      <MemoPhotoModal
        visible={memoPhotoItem !== null}
        item={memoPhotoItem}
        onClose={() => setMemoPhotoItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, opacity: 0.8 },
  sectionHeader: {
    paddingTop: isNative ? 10 : 16,
    paddingBottom: isNative ? 4 : 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: isNative ? 15 : 18,
    fontWeight: '700',
    marginBottom: isNative ? 4 : 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: isNative ? 3 : 6,
    padding: isNative ? 10 : 14,
    borderRadius: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardRowSecondary: { marginTop: 4 },
  foodNameCompact: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    minWidth: 0,
  },
  remainingCompact: { fontSize: 13, color: '#333' },
  remainingUrgentCompact: { fontSize: 13, color: '#c00', fontWeight: '600' },
  storageCompact: { fontSize: 12, opacity: 0.85 },
  memoPhotoLinkCompact: { paddingVertical: 2, paddingHorizontal: 0 },
  memoPhotoLinkTextCompact: { fontSize: 12, color: '#2f95dc' },
  actionsCompact: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  editBtnCompact: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#2f95dc',
    borderRadius: 6,
  },
  editBtnTextCompact: { color: '#fff', fontSize: 12 },
  eatenBtnCompact: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#999',
  },
  eatenBtnTextCompact: { color: '#666', fontSize: 12 },
  cardMain: { marginBottom: 10 },
  foodName: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  storage: { fontSize: 13, opacity: 0.8, marginBottom: 4 },
  remaining: { fontSize: 15, marginBottom: 4 },
  remainingUrgent: { fontSize: 15, marginBottom: 4, color: '#c00' },
  memoPhotoLink: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  memoPhotoLinkText: { fontSize: 15, color: '#2f95dc', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
  },
  editBtnText: { color: '#fff', fontSize: 14 },
  eatenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
  },
  eatenBtnText: { color: '#666', fontSize: 14 },
});
