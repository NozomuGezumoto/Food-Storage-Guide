import React, { useMemo } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { getFoodById } from '@/data/foods';
import type { FoodMaster } from '@/types';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { View as ThemedView, Text as ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { t, getFoodDisplayName } from '@/utils/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

const MAX_FREQUENT = 15;

export default function FrequentAddModal({ visible, onClose, onAdded }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const items = usePurchasesStore((s) => s.items);
  const add = usePurchasesStore((s) => s.add);

  const frequentFoods = useMemo(() => {
    const countByFoodId = new Map<string, number>();
    for (const p of items) {
      countByFoodId.set(p.foodId, (countByFoodId.get(p.foodId) ?? 0) + 1);
    }
    const foodIds = [...countByFoodId.keys()];
    const foods: FoodMaster[] = [];
    for (const id of foodIds) {
      const food = getFoodById(id);
      if (food) foods.push(food);
    }
    foods.sort(
      (a, b) =>
        (countByFoodId.get(b.id) ?? 0) - (countByFoodId.get(a.id) ?? 0) ||
        getFoodDisplayName(a).localeCompare(getFoodDisplayName(b))
    );
    return foods.slice(0, MAX_FREQUENT);
  }, [items]);

  const handleAdd = async (food: FoodMaster) => {
    try {
      const storage = food.defaultStorage;
      const notifyDays = food.defaultNotifyDaysByStorage[storage] ?? 3;
      const purchasedAt = Date.now();
      await add({
        foodId: food.id,
        foodName: getFoodDisplayName(food),
        storage,
        purchasedAt,
        notifyDays,
        notifyDayBefore: true,
        notifyOnDay: true,
      });
      onAdded?.();
      onClose();
    } catch (_e) {
      // Error handled by store/alert if needed
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />
          <ThemedText style={[styles.title, { color: colors.text }]}>{t('home.frequentAdd.title')}</ThemedText>
          {frequentFoods.length === 0 ? (
            <ThemedText style={[styles.empty, { color: colors.textMuted }]}>{t('home.frequentAdd.empty')}</ThemedText>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {frequentFoods.map((food) => (
                <Pressable
                  key={food.id}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: colors.cardBg },
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handleAdd(food)}
                >
                  <ThemedText style={[styles.rowTitle, { color: colors.text }]}>{getFoodDisplayName(food)}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  empty: {
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 24,
  },
  scroll: {
    maxHeight: 400,
  },
  row: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
