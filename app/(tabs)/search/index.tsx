import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  SectionList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Text as PlainText } from 'react-native';
import { searchFoods, FOOD_CATEGORIES } from '@/data/foods';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import type { FoodMaster, FoodCategory } from '@/types';
import { t, getFoodDisplayName } from '@/utils/i18n';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

function FoodRow({ item, colors }: { item: FoodMaster; colors: typeof Colors.light }) {
  return (
    <Link href={`/search/food/${item.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, { backgroundColor: colors.cardBg }, pressed && styles.cardPressed]}>
        <Text style={styles.rowTitle}>{getFoodDisplayName(item)}</Text>
        <Text style={[styles.rowSub, { color: colors.textMuted }]}>
          {item.storageOptions.map((s) =>
            s === 'fridge'
              ? t('common.storage.fridge')
              : s === 'freezer'
              ? t('common.storage.freezer')
              : t('common.storage.room')
          ).join(' / ')}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const items = usePurchasesStore((s) => s.items);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = Colors[colorScheme ?? 'light'];
  const sections = useMemo(() => {
    const list =
      selectedCategory === 'all'
        ? searchFoods(query)
        : searchFoods(query).filter((f) => f.category === selectedCategory);
    const countByFoodId = new Map<string, number>();
    for (const p of items) {
      countByFoodId.set(p.foodId, (countByFoodId.get(p.foodId) ?? 0) + 1);
    }
    const frequent = list.filter((f) => (countByFoodId.get(f.id) ?? 0) > 0);
    const others = list.filter((f) => (countByFoodId.get(f.id) ?? 0) === 0);
    frequent.sort((a, b) => (countByFoodId.get(b.id) ?? 0) - (countByFoodId.get(a.id) ?? 0) || getFoodDisplayName(a).localeCompare(getFoodDisplayName(b)));
    others.sort((a, b) => getFoodDisplayName(a).localeCompare(getFoodDisplayName(b)));
    const result: { title: string; data: FoodMaster[] }[] = [];
    if (frequent.length > 0) {
      result.push({ title: t('search.section.frequent'), data: frequent });
    }
    result.push({ title: t('search.section.allFoods'), data: others });
    return result;
  }, [query, selectedCategory, items]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.searchRow, { backgroundColor: colors.cardBg }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}
          placeholder={t('search.placeholder.query')}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={[styles.categoryWrapContainer, { backgroundColor: colors.background }]}>
        <View style={styles.categoryWrap}>
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <PlainText
              style={[
                styles.categoryChipText,
                isDark && styles.categoryChipTextDark,
                selectedCategory === 'all' && styles.categoryChipTextSelected,
              ]}
            >
              {t('search.category.all')}
            </PlainText>
          </Pressable>
          {FOOD_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <PlainText
                style={[
                  styles.categoryChipText,
                  isDark && styles.categoryChipTextDark,
                  selectedCategory === cat && styles.categoryChipTextSelected,
                ]}
              >
                {t(`search.category.${cat}`)}
              </PlainText>
            </Pressable>
          ))}
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => <FoodRow item={item} colors={colors} />}
      />
    </KeyboardAvoidingView>
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
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    borderWidth: 1,
  },
  categoryWrapContainer: {
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginRight: 6,
    marginBottom: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#0D9488',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  categoryChipTextDark: {
    color: '#e5e5e5',
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  card: {
    marginHorizontal: 14,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: { opacity: 0.9 },
  rowTitle: { fontSize: 19, fontWeight: '700', marginBottom: 4 },
  rowSub: { fontSize: 15, opacity: 0.85 },
});
