import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import type { StorageType } from '@/types';
import { getFoodById } from '@/data/foods';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { View as ThemedView, Text as ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { goToSearch } from '@/utils/navigation';
import { blobUrlToDataUrl, isBlobUrl } from '@/utils/photoUtils';
import { t, getFoodDisplayName } from '@/utils/i18n';
import { isInInclusiveRange } from '@/utils/dateUtils';

const storageLabels: Record<StorageType, string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

export default function PurchaseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const add = usePurchasesStore((s) => s.add);

  const food = id && typeof id === 'string' ? getFoodById(id) : null;

  const [storage, setStorage] = useState<StorageType>(food?.defaultStorage ?? 'fridge');
  const [notifyDays, setNotifyDays] = useState(food ? (food.defaultNotifyDaysByStorage[food.defaultStorage] ?? 3) : 3);
  const [notifyDayBefore, setNotifyDayBefore] = useState(true);
  const [notifyOnDay, setNotifyOnDay] = useState(true);
  const [memo, setMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (food) {
      setStorage(food.defaultStorage);
      const d = food.defaultNotifyDaysByStorage[food.defaultStorage];
      setNotifyDays(d ?? 3);
    }
  }, [food]);

  if (!food) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.error}>{t('food.notFound')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>{t('common.back')}</Text>
        </Pressable>
      </ThemedView>
    );
  }

  const range = food.rangeDaysByStorage[storage];
  const min = range?.min ?? 1;
  const max = range?.max ?? 30;
  const outOfRange = !isInInclusiveRange(notifyDays, min, max);

  const handleSave = async () => {
    console.log('[Purchase] handleSave が呼ばれました');
    if (saving) {
      console.log('[Purchase] 保存中なのでスキップ');
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUri = photoUri;
      if (Platform.OS === 'web' && photoUri && isBlobUrl(photoUri)) {
        try {
          finalPhotoUri = await blobUrlToDataUrl(photoUri);
        } catch (e) {
          console.warn('[Purchase] blob を data URL に変換できませんでした', e);
        }
      }
      const purchasedAt = Date.now();
      const payload = {
        foodId: food.id,
        foodName: getFoodDisplayName(food),
        storage,
        purchasedAt,
        notifyDays,
        notifyDayBefore,
        notifyOnDay,
        photoUri: finalPhotoUri,
        memo: memo.trim() || undefined,
      };
      console.log('[Purchase] add を呼びます', payload);
      await add(payload);
      console.log('[Purchase] add 完了。検索へ遷移します');
      goToSearch(router);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        setTimeout(() => {
          const path = window.location.pathname;
          if (path !== '/search' && !path.startsWith('/search?')) {
            console.log('[Purchase] router.replace が効いていないため window.location で遷移', path);
            window.location.href = '/search';
          }
        }, 150);
      }
    } catch (e) {
      console.error('[Purchase] handleSave でエラー', e);
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert(t('common.error'), t('purchase.error.registerFailed', { message }));
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('purchase.photoPermission.title'), t('purchase.photoPermission.body'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (_e) {
      // Web などでスキップ
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('purchase.cameraPermission.title'), t('purchase.cameraPermission.body'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (_e) {
      // Web などでスキップ
    }
  };

  return (
    <ThemedView style={styles.container}>
      {Platform.OS !== 'web' ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, styles.contentScroll]}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText style={styles.title}>
              {t('purchase.title.withName', { name: getFoodDisplayName(food) })}
            </ThemedText>

            <ThemedText style={styles.label}>{t('purchase.label.storage')}</ThemedText>
            <View style={styles.storageRow}>
              {(food.storageOptions as StorageType[]).map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.storageBtn,
                    { backgroundColor: storage === s ? '#2f95dc' : isDark ? '#333' : '#eee' },
                    storage === s && styles.storageBtnActive,
                  ]}
                  onPress={() => {
                    setStorage(s);
                    const d = food.defaultNotifyDaysByStorage[s];
                    if (d != null) setNotifyDays(d);
                  }}
                >
                  <Text style={[
                    styles.storageBtnText,
                    { color: storage === s ? '#fff' : colors.text },
                    storage === s && styles.storageBtnTextActive,
                  ]}>
                    {storageLabels[s]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ThemedText style={styles.label}>
              {t('purchase.label.notify', { min, max })}
            </ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setNotifyDays((n) => Math.max(min, n - 1))}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <ThemedText style={styles.stepperValue}>
                {t('common.daysFromReg', { count: notifyDays })}
              </ThemedText>
              <Pressable style={styles.stepperBtn} onPress={() => setNotifyDays((n) => Math.min(max, n + 1))}>
                <Text style={styles.stepperText}>＋</Text>
              </Pressable>
            </View>
            {outOfRange && (
              <Text style={styles.warn}>
                {t('purchase.outOfRange', { min, max })}
              </Text>
            )}

            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>
                {t('purchase.label.notify.dayBefore')}
              </ThemedText>
              <Switch
                value={notifyDayBefore}
                onValueChange={setNotifyDayBefore}
                trackColor={{ false: '#ccc', true: '#2f95dc' }}
              />
            </View>
            <View style={styles.switchRow}>
              <ThemedText style={styles.switchLabel}>
                {t('purchase.label.notify.onDay')}
              </ThemedText>
              <Switch
                value={notifyOnDay}
                onValueChange={setNotifyOnDay}
                trackColor={{ false: '#ccc', true: '#2f95dc' }}
              />
            </View>

            <ThemedText style={styles.label}>{t('common.memo.optional')}</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.memoInput,
                {
                  backgroundColor: isDark ? '#333' : '#fff',
                  borderColor: isDark ? '#555' : '#ddd',
                  color: colors.text,
                },
              ]}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('common.memo.placeholder')}
              placeholderTextColor={isDark ? '#999' : '#888'}
              multiline
              numberOfLines={3}
            />

            <ThemedText style={styles.label}>{t('common.photo.optional')}</ThemedText>
            <View style={styles.photoBtnRow}>
              <Pressable style={styles.photoBtn} onPress={pickImage}>
                <Text style={[styles.photoBtnText, { color: colors.tint }]}>
                  {photoUri ? t('common.photo.change') : t('common.photo.add')}
                </Text>
              </Pressable>
              <Pressable style={styles.photoBtn} onPress={takePhoto}>
                <Text style={[styles.photoBtnText, { color: colors.tint }]}>
                  {t('common.photo.camera')}
                </Text>
              </Pressable>
            </View>
            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              </View>
            ) : null}
          </ScrollView>
          <View style={[styles.footerFixed, { backgroundColor: colors.background }]}>
            <Link href="/search" asChild>
              <Pressable style={[styles.cancelBtn, isDark && { backgroundColor: '#333' }]}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </Link>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>
                {saving ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <ThemedText style={styles.title}>
            {t('purchase.title.withName', { name: getFoodDisplayName(food) })}
          </ThemedText>

          <ThemedText style={styles.label}>{t('purchase.label.storage')}</ThemedText>
          <View style={styles.storageRow}>
            {(food.storageOptions as StorageType[]).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.storageBtn,
                  { backgroundColor: storage === s ? '#2f95dc' : isDark ? '#333' : '#eee' },
                  storage === s && styles.storageBtnActive,
                ]}
                onPress={() => {
                  setStorage(s);
                  const d = food.defaultNotifyDaysByStorage[s];
                  if (d != null) setNotifyDays(d);
                }}
              >
                <Text style={[
                  styles.storageBtnText,
                  { color: storage === s ? '#fff' : colors.text },
                  storage === s && styles.storageBtnTextActive,
                ]}>
                  {storageLabels[s]}
                </Text>
              </Pressable>
            ))}
          </View>

          <ThemedText style={styles.label}>
            {t('purchase.label.notify', { min, max })}
          </ThemedText>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setNotifyDays((n) => Math.max(min, n - 1))}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <ThemedText style={styles.stepperValue}>
              {t('common.daysFromReg', { count: notifyDays })}
            </ThemedText>
            <Pressable style={styles.stepperBtn} onPress={() => setNotifyDays((n) => Math.min(max, n + 1))}>
              <Text style={styles.stepperText}>＋</Text>
            </Pressable>
          </View>
          {outOfRange && (
            <Text style={styles.warn}>
              {t('purchase.outOfRange', { min, max })}
            </Text>
          )}

          <View style={styles.switchRow}>
            <ThemedText style={styles.switchLabel}>
              {t('purchase.label.notify.dayBefore')}
            </ThemedText>
            <Switch
              value={notifyDayBefore}
              onValueChange={setNotifyDayBefore}
              trackColor={{ false: '#ccc', true: '#2f95dc' }}
            />
          </View>
          <View style={styles.switchRow}>
            <ThemedText style={styles.switchLabel}>
              {t('purchase.label.notify.onDay')}
            </ThemedText>
            <Switch
              value={notifyOnDay}
              onValueChange={setNotifyOnDay}
              trackColor={{ false: '#ccc', true: '#2f95dc' }}
            />
          </View>

          <ThemedText style={styles.label}>{t('common.memo.optional')}</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.memoInput,
              {
                backgroundColor: isDark ? '#333' : '#fff',
                borderColor: isDark ? '#555' : '#ddd',
                color: colors.text,
              },
            ]}
            value={memo}
            onChangeText={setMemo}
            placeholder={t('common.memo.placeholder')}
            placeholderTextColor={isDark ? '#999' : '#888'}
            multiline
            numberOfLines={3}
          />

          <ThemedText style={styles.label}>{t('common.photo.optional')}</ThemedText>
          <View style={styles.photoBtnRow}>
            <Pressable style={styles.photoBtn} onPress={pickImage}>
              <Text style={[styles.photoBtnText, { color: colors.tint }]}>
                {photoUri ? t('common.photo.change') : t('common.photo.add')}
              </Text>
            </Pressable>
            <Pressable style={styles.photoBtn} onPress={takePhoto}>
              <Text style={[styles.photoBtnText, { color: colors.tint }]}>
                {t('common.photo.camera')}
              </Text>
            </Pressable>
          </View>
          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            </View>
          ) : null}

          <View style={styles.footer}>
            <Link href="/search" asChild>
              <Pressable style={[styles.cancelBtn, isDark && { backgroundColor: '#333' }]}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </Link>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>
                {saving ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const isNative = Platform.OS !== 'web';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: isNative ? 14 : 20,
    paddingBottom: isNative ? 24 : 40,
  },
  contentScroll: {
    paddingBottom: 16,
  },
  footerFixed: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: isNative ? 14 : 20,
    paddingTop: 12,
    paddingBottom: isNative ? 36 : 16,
  },
  error: { padding: 16 },
  link: { color: '#2f95dc', padding: 16 },
  title: {
    fontSize: isNative ? 18 : 20,
    fontWeight: '700',
    marginBottom: isNative ? 12 : 20,
  },
  label: {
    fontSize: isNative ? 13 : 14,
    fontWeight: '500',
    marginBottom: isNative ? 4 : 6,
    marginTop: isNative ? 10 : 16,
  },
  storageRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  storageBtn: {
    paddingVertical: isNative ? 6 : 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  storageBtnActive: { backgroundColor: '#2f95dc' },
  storageBtnText: { fontSize: isNative ? 14 : 15 },
  storageBtnTextActive: { color: '#fff', fontWeight: '500' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: isNative ? 12 : 16 },
  stepperBtn: {
    width: isNative ? 36 : 40,
    height: isNative ? 36 : 40,
    borderRadius: isNative ? 18 : 20,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: '#fff', fontSize: isNative ? 18 : 20, fontWeight: '600' },
  stepperValue: { fontSize: isNative ? 16 : 18, fontWeight: '600', minWidth: 48, textAlign: 'center' },
  warn: { fontSize: 12, color: '#c00', marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: isNative ? 4 : 8,
  },
  switchLabel: { fontSize: isNative ? 14 : 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: isNative ? 8 : 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  memoInput: { minHeight: isNative ? 52 : 72, textAlignVertical: 'top' },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginTop: isNative ? 6 : 8 },
  photoBtn: {
    flex: 1,
    marginTop: 0,
    paddingVertical: isNative ? 8 : 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2f95dc',
    borderRadius: 8,
  },
  photoBtnText: { fontSize: isNative ? 14 : 15 },
  footer: { flexDirection: 'row', gap: 12, marginTop: isNative ? 14 : 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: isNative ? 12 : 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  cancelBtnText: { fontSize: isNative ? 15 : 16 },
  photoPreviewWrap: { marginTop: isNative ? 8 : 12, alignItems: 'center' },
  photoPreview: {
    width: isNative ? 96 : 120,
    height: isNative ? 96 : 120,
    borderRadius: 8,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: isNative ? 12 : 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2f95dc',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: isNative ? 15 : 16, fontWeight: '600' },
});
