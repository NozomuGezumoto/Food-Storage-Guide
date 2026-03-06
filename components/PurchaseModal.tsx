import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { FoodMaster, StorageType } from '@/types';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { View as ThemedView, Text as ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { blobUrlToDataUrl, isBlobUrl } from '@/utils/photoUtils';
import { t, getFoodDisplayName } from '@/utils/i18n';
import { isInInclusiveRange } from '@/utils/dateUtils';

const isWeb = Platform.OS === 'web';
const storageLabels: Record<StorageType, string> = {
  fridge: t('common.storage.fridge'),
  freezer: t('common.storage.freezer'),
  room: t('common.storage.room'),
};

type Props = {
  visible: boolean;
  food: FoodMaster;
  onClose: () => void;
  onSaved: () => void;
};

export default function PurchaseModal({ visible, food, onClose, onSaved }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const add = usePurchasesStore((s) => s.add);

  const [storage, setStorage] = useState<StorageType>(food.defaultStorage);
  const [notifyDays, setNotifyDays] = useState(() => {
    const d = food.defaultNotifyDaysByStorage[food.defaultStorage];
    return d ?? 3;
  });
  const [notifyDayBefore, setNotifyDayBefore] = useState(true);
  const [notifyOnDay, setNotifyOnDay] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    setStorage(food.defaultStorage);
    const d = food.defaultNotifyDaysByStorage[food.defaultStorage];
    setNotifyDays(d ?? 3);
    setNotifyDayBefore(true);
    setNotifyOnDay(true);
    setPhotoUri(undefined);
  }, [visible, food]);

  const range = food.rangeDaysByStorage[storage];
  const min = range?.min ?? 1;
  const max = range?.max ?? 30;
  const outOfRange = !isInInclusiveRange(notifyDays, min, max);

  const handleSave = async () => {
    try {
      let finalPhotoUri = photoUri;
      if (isWeb && photoUri && isBlobUrl(photoUri)) {
        try {
          finalPhotoUri = await blobUrlToDataUrl(photoUri);
        } catch (_e) {
          // 変換失敗時はそのまま（表示は別画面で無効になる可能性あり）
        }
      }
      const purchasedAt = Date.now();
      await add({
        foodId: food.id,
        foodName: getFoodDisplayName(food),
        storage,
        purchasedAt,
        notifyDays,
        notifyDayBefore,
        notifyOnDay,
        photoUri: finalPhotoUri,
      });
      onSaved();
    } catch (e) {
      Alert.alert(t('common.error'), t('purchase.error.generic'));
    }
  };

  const pickImage = async () => {
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
  };

  const takePhoto = async () => {
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
  };

  if (!visible) return null;

  const overlayStyle = [
    styles.overlay,
    isWeb && {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
    },
  ];

  const content = (
    <View style={overlayStyle} pointerEvents="box-none">
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      <ThemedView style={styles.sheet} lightColor="#fff" darkColor="#1c1c1e" onStartShouldSetResponder={() => true}>
        <View style={styles.handle} />
        <ThemedText style={styles.title}>{t('purchase.title')}</ThemedText>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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
                <Text
                  style={[
                    styles.storageBtnText,
                    { color: storage === s ? '#fff' : colors.text },
                    storage === s && styles.storageBtnTextActive,
                  ]}
                >
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
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setNotifyDays((n) => Math.min(max, n + 1))}
            >
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

        <View style={styles.footer}>
          <Pressable style={[styles.cancelBtn, isDark && { backgroundColor: '#333' }]} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>
              {t('common.cancel')}
            </Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </ThemedView>
    </View>
  );

  if (isWeb && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(content, document.body);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  scroll: { paddingHorizontal: 20, maxHeight: 400 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  storageRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  storageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  storageBtnActive: { backgroundColor: '#2f95dc' },
  storageBtnText: { fontSize: 15 },
  storageBtnTextActive: { color: '#fff', fontWeight: '500' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  stepperValue: { fontSize: 18, fontWeight: '600', minWidth: 48, textAlign: 'center' },
  warn: { fontSize: 13, color: '#c00', marginTop: 6 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: { fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  photoBtn: {
    flex: 1,
    marginTop: 0,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2f95dc',
    borderRadius: 8,
  },
  photoBtnText: { fontSize: 15 },
  photoPreviewWrap: { marginTop: 12, alignItems: 'center' },
  photoPreview: { width: 100, height: 100, borderRadius: 8 },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#eee' },
  cancelBtnText: { fontSize: 16 },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#2f95dc' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
