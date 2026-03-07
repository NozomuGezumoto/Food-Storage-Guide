import EditModal from '@/components/EditModal';
import FrequentAddModal from '@/components/FrequentAddModal';
import MemoPhotoModal from '@/components/MemoPhotoModal';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import type { PurchaseItem } from '@/types';
import { getRemainingDays, msUntilNextMidnight } from '@/utils/dateUtils';
import { getFoodDisplayNameById, t } from '@/utils/i18n';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Platform, Pressable, SectionList, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const storageLabels: Record<PurchaseItem['storage'], string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

type ItemWithRemaining = PurchaseItem & { remaining: number };

const isNative = Platform.OS !== 'web';

const SECTION_TODAY_MUST = t('home.section.todayMust');
const SECTION_TODAY = t('home.section.today');
const SECTION_SOON = t('home.section.soon');
const SECTION_LATER = t('home.section.later');

const CELEBRATION_PLACEHOLDER_ID = '__today_zero_celebration__';
type SectionItem = ItemWithRemaining | { id: string; __celebrationPlaceholder: true };
type Section = { title: string; data: SectionItem[]; rangeLabel: string; displayCount?: number };

function buildSections(items: PurchaseItem[]): Section[] {
  const withRemaining: ItemWithRemaining[] = items.map((item) => ({
    ...item,
    remaining: getRemainingDays(item.notifyAt),
  }));
  const todayMust = withRemaining.filter((i) => i.remaining === 0).sort((a, b) => a.notifyAt - b.notifyAt);
  const today = withRemaining.filter((i) => i.remaining === 1).sort((a, b) => a.notifyAt - b.notifyAt);
  const soon = withRemaining
    .filter((i) => i.remaining >= 2 && i.remaining <= 6)
    .sort((a, b) => a.notifyAt - b.notifyAt);
  const later = withRemaining.filter((i) => i.remaining >= 7).sort((a, b) => a.notifyAt - b.notifyAt);

  const sections: Section[] = [];
  if (todayMust.length > 0) {
    sections.push({
      title: SECTION_TODAY_MUST,
      data: todayMust,
      rangeLabel: t('home.range.todayMust'),
    });
  } else if (withRemaining.length > 0) {
    sections.push({
      title: SECTION_TODAY_MUST,
      data: [{ id: CELEBRATION_PLACEHOLDER_ID, __celebrationPlaceholder: true }],
      rangeLabel: t('home.range.todayMust'),
      displayCount: 0,
    });
  }
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { items, load, markEaten, update } = usePurchasesStore();
  const activeItems = useMemo(() => items.filter((i) => !i.eatenAt), [items]);
  const insets = useSafeAreaInsets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memoPhotoItem, setMemoPhotoItem] = useState<PurchaseItem | null>(null);
  const [frequentAddVisible, setFrequentAddVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const onVisibilityChange = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          setRefreshKey((k) => k + 1);
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') setRefreshKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  // 次の 0:00 に refreshKey を更新（画面表示中に日付をまたいだ場合の表示更新）
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextMidnight = () => {
      const ms = msUntilNextMidnight();
      timeoutId = setTimeout(() => {
        setRefreshKey((k) => k + 1);
        timeoutId = null;
        scheduleNextMidnight();
      }, ms);
    };

    scheduleNextMidnight();

    return () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  const sections = useMemo(() => buildSections(activeItems), [activeItems, refreshKey]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        contentContainerStyle={{ paddingBottom: 80 }}
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('home.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('home.empty.body')}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const accentColor =
            section.title === SECTION_TODAY_MUST
              ? colors.urgent
              : section.title === SECTION_TODAY
                ? colors.soon
                : section.title === SECTION_SOON
                  ? colors.soon
                  : colors.textMuted;
          const leftSlotWidth = isNative ? 14 : 18;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
              <View style={[styles.sectionHeaderRow, { backgroundColor: 'transparent' }]}>
                <View style={[styles.sectionHeaderLeftSlot, { width: leftSlotWidth }]}>
                  <View
                    style={[
                      styles.sectionHeaderLine,
                      {
                        backgroundColor: accentColor,
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        marginTop: -13,
                      },
                    ]}
                  />
                </View>
                <View style={[styles.sectionHeaderTextRow, { flex: 1 }]}>
                  <Text style={styles.sectionTitle}>
                    {section.title} ({section.displayCount ?? section.data.length})
                  </Text>
                  <Text style={[styles.sectionTitle, { color: accentColor }]}>{section.rangeLabel}</Text>
                </View>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => {
          if ('__celebrationPlaceholder' in item && item.__celebrationPlaceholder) {
            return (
              <View style={[styles.todayZeroBanner, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.todayZeroTitle, { color: colors.text }]}>
                  🎉 {t('home.todayZero.title')}
                </Text>
                <Text style={[styles.todayZeroSub, { color: colors.textMuted }]}>
                  {t('home.todayZero.sub')}
                </Text>
              </View>
            );
          }
          const it = item as ItemWithRemaining;
          const remaining = it.remaining;
          const hasMemoOrPhoto = !!(it.memo?.trim() || it.photoUri);
          const displayName = getFoodDisplayNameById(it.foodId, it.foodName);
          // 期限表示の色：0-1=赤, 2-6=オレンジ, 7+=グレー
          const remainingColor =
            remaining <= 1 ? colors.urgent : remaining <= 6 ? colors.soon : colors.textMuted;
          // 期限までの視覚ゲージ：10日=100%、1日=10%
          const gaugeProgress = Math.max(0, Math.min(1, remaining / 10));

          const renderRightActions = (
            _progress: unknown,
            _dragX: unknown,
            swipeable: { close: () => void }
          ) => (
            <View style={styles.swipeActions}>
              <Pressable
                style={[styles.swipeActionEat, { backgroundColor: '#6B7280' }]}
                onPress={() => {
                  swipeable.close();
                  handleEaten(it);
                }}
              >
                <Text style={[styles.swipeActionText, { color: 'white' }]}>{t('home.actions.eaten')}</Text>
              </Pressable>
              <Pressable
                style={[styles.swipeActionEdit, { backgroundColor: '#e5e7eb' }]}
                onPress={() => {
                  swipeable.close();
                  setEditingId(it.id);
                }}
              >
                <Text style={[styles.swipeActionText, { color: '#374151' }]}>{t('home.actions.edit')}</Text>
              </Pressable>
            </View>
          );

          const cardContent = (
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
              {isNative ? (
                <>
                  <View style={styles.cardContent}>
                    <Text style={styles.foodNameStacked} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[remaining <= 1 ? styles.remainingUrgentCompact : styles.remainingCompact, { color: remainingColor }]}>
                      {remaining === 0
                        ? t('home.remaining.expired')
                        : remaining === 1
                          ? t('home.remaining.tomorrow')
                          : t('home.remaining.daysLeft', { days: remaining })}
                    </Text>
                    <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.gaugeFill,
                          { width: `${gaugeProgress * 100}%`, backgroundColor: remainingColor },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={[styles.cardRow, styles.cardRowSecondary]}>
                    <View style={styles.storageRowLeft}>
                      <Text style={styles.storageCompact}>{storageLabels[it.storage]}</Text>
                      {hasMemoOrPhoto && (
                        <Pressable
                          style={styles.memoPhotoLinkCompact}
                          onPress={() => setMemoPhotoItem(it)}
                        >
                          <Text style={[styles.memoPhotoLinkTextCompact, { color: colors.tint }]}>
                            {t('home.memoPhoto.link.compact')}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardMain}>
                    <Text style={styles.foodName}>{displayName}</Text>
                    <Text style={[remaining <= 1 ? styles.remainingUrgent : styles.remaining, { color: remainingColor }]}>
                      {remaining === 0
                        ? t('home.remaining.expired')
                        : remaining === 1
                          ? t('home.remaining.tomorrow')
                          : t('home.remaining.daysLeft', { days: remaining })}
                    </Text>
                    <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.gaugeFill,
                          { width: `${gaugeProgress * 100}%`, backgroundColor: remainingColor },
                        ]}
                      />
                    </View>
                    {hasMemoOrPhoto && (
                      <Pressable
                        style={styles.memoPhotoLink}
                        onPress={() => setMemoPhotoItem(it)}
                      >
                        <Text style={[styles.memoPhotoLinkText, { color: colors.tint }]}>
                          {t('home.memoPhoto.link.full')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={[styles.storageActionsRow, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.storage}>{storageLabels[it.storage]}</Text>
                    <View style={styles.actions}>
                      <Pressable
                        style={[styles.editBtn, { borderColor: colorScheme === 'dark' ? '#888' : '#999' }]}
                        onPress={() => setEditingId(it.id)}
                      >
                        <Text style={[styles.editBtnText, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                          {t('home.actions.edit')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.eatenBtn, { borderColor: colors.textMuted }]}
                        onPress={() => handleEaten(it)}
                      >
                        <Text style={[styles.eatenBtnText, { color: colors.textMuted }]}>{t('home.actions.eaten')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </View>
          );

          if (isNative) {
            return (
              <Swipeable
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                  if (direction === 'right') handleEaten(it);
                }}
                rightThreshold={80}
                friction={1.5}
              >
                {cardContent}
              </Swipeable>
            );
          }
          return cardContent;
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
      <Pressable
        style={[
          styles.fab,
          {
            right: 20,
            bottom: insets.bottom + 4,
            backgroundColor: '#4CAF50',
          },
        ]}
        onPress={() => setFrequentAddVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <FrequentAddModal
        visible={frequentAddVisible}
        onClose={() => setFrequentAddVisible(false)}
        onAdded={() => setRefreshKey((k) => k + 1)}
      />
    </View>
  );
}

// 主婦・料理人向け：見やすさ・タップしやすさ（min 44pt タッチ）
const styles = StyleSheet.create({
  container: { flex: 1 },
  todayZeroBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  todayZeroTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  todayZeroSub: { fontSize: 14 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, marginBottom: 10 },
  emptySub: { fontSize: 16, opacity: 0.85 },
  sectionHeader: {
    paddingTop: isNative ? 12 : 14,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderLeftSlot: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  sectionHeaderTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLine: {
    width: 4,
    height: 26,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: isNative ? 20 : 23,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 14,
    marginTop: 1,
    marginBottom: 1,
    padding: isNative ? 14 : 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  cardRowSecondary: {
    marginTop: 8,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  storageRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  foodNameCompact: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    minWidth: 0,
  },
  foodNameStacked: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 2,
  },
  remainingCompact: { fontSize: 13, fontWeight: '600' },
  remainingUrgentCompact: { fontSize: 13, fontWeight: '600' },
  gaugeTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2,
  },
  storageCompact: { fontSize: 14, opacity: 0.85 },
  memoPhotoLinkCompact: { paddingVertical: 6, paddingHorizontal: 4, minHeight: 44 },
  memoPhotoLinkTextCompact: { fontSize: 14 },
  cardMain: { marginBottom: 8, backgroundColor: 'transparent' },
  storageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodName: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  storage: { fontSize: 15, opacity: 0.85 },
  remaining: { fontSize: 14, marginBottom: 6, fontWeight: '600' },
  remainingUrgent: { fontSize: 14, marginBottom: 6, fontWeight: '600' },
  memoPhotoLink: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  memoPhotoLinkText: { fontSize: 17, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 10, backgroundColor: 'transparent' },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 34,
    justifyContent: 'center',
  },
  editBtnText: { fontSize: 14, fontWeight: '600' },
  eatenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 34,
    justifyContent: 'center',
  },
  eatenBtnText: { fontSize: 14 },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 14,
    marginVertical: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeActionEat: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 88,
  },
  swipeActionEdit: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 88,
  },
  swipeActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 26,
    fontWeight: '300',
    color: 'white',
    lineHeight: 30,
  },
});
