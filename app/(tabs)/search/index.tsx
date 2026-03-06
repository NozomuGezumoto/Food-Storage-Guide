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

function FoodRow({ item }: { item: FoodMaster }) {
  return (
    <Link href={`/search/food/${item.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <Text style={styles.rowTitle}>{getFoodDisplayName(item)}</Text>
        <Text style={styles.rowSub}>
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchRow} lightColor="#eee" darkColor="#333">
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder.query')}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.categoryWrapContainer} lightColor="#f5f5f5" darkColor="#1e1e1e">
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
          <View style={styles.sectionHeader} lightColor="#f0f0f0" darkColor="#2a2a2a">
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => <FoodRow item={item} />}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryWrapContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginRight: 6,
    marginBottom: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#2f95dc',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  rowPressed: { backgroundColor: 'rgba(0,0,0,0.05)' },
  rowTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  rowSub: { fontSize: 13, opacity: 0.7 },
});
