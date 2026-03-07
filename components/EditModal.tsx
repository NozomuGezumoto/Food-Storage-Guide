import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { PurchaseItem } from '@/types';
import { getFoodById } from '@/data/foods';
import { View as ThemedView, Text as ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { blobUrlToDataUrl, isBlobUrl } from '@/utils/photoUtils';
import { t } from '@/utils/i18n';
import { isInInclusiveRange } from '@/utils/dateUtils';

export type EditModalSavePayload = {
  notifyDays: number;
  memo?: string;
  photoUri?: string;
};

type Props = {
  visible: boolean;
  purchaseItem: PurchaseItem | null;
  onClose: () => void;
  onSave: (id: string, data: EditModalSavePayload) => void | Promise<void>;
};

export default function EditModal({
  visible,
  purchaseItem,
  onClose,
  onSave,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [notifyDays, setNotifyDays] = useState(3);
  const [memo, setMemo] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (purchaseItem) {
      setNotifyDays(purchaseItem.notifyDays);
      setMemo(purchaseItem.memo ?? '');
      setPhotoUri(purchaseItem.photoUri);
    }
  }, [purchaseItem]);

  if (!visible || !purchaseItem) return null;

  const food = getFoodById(purchaseItem.foodId);
  const range = food?.rangeDaysByStorage[purchaseItem.storage];
  const guideMin = range?.min ?? 1;
  const guideMax = range?.max ?? 30;
  const stepperMin = 0;
  const stepperMax = guideMax;
  const outOfRange = !isInInclusiveRange(notifyDays, guideMin, guideMax);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let finalPhotoUri = photoUri;
      if (Platform.OS === 'web' && photoUri && isBlobUrl(photoUri)) {
        try {
          finalPhotoUri = await blobUrlToDataUrl(photoUri);
        } catch (_e) {
          // 変換失敗時はそのまま
        }
      }
      await onSave(purchaseItem.id, {
        notifyDays,
        memo: memo.trim() || undefined,
        photoUri: finalPhotoUri,
      });
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), t('edit.error.saveFailed'));
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
    } catch (_e) {}
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
    } catch (_e) {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ThemedView style={styles.sheet} lightColor="#fff" darkColor="#1c1c1e">
          <ThemedText style={styles.title}>{t('edit.title')}</ThemedText>
          <ThemedText style={styles.foodName}>{purchaseItem.foodName}</ThemedText>

          <ScrollView style={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.label}>{t('edit.label.notify')}</ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setNotifyDays((n) => Math.max(stepperMin, n - 1))}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <ThemedText style={styles.stepperValue}>
                {t('common.daysFromReg', { count: notifyDays })}
              </ThemedText>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setNotifyDays((n) => Math.min(stepperMax, n + 1))}
              >
                <Text style={styles.stepperText}>＋</Text>
              </Pressable>
            </View>

            <ThemedText style={styles.label}>{t('common.memo.optional')}</ThemedText>
            <TextInput
              style={[
                styles.input,
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
              numberOfLines={2}
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

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '88%',
    maxWidth: 340,
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
  },
  scroll: { maxHeight: 320 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  foodName: { fontSize: 17, textAlign: 'center', marginBottom: 18, opacity: 0.9 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, marginTop: 14 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  stepperBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  stepperValue: { fontSize: 21, fontWeight: '600', minWidth: 60, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  photoBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0D9488',
    borderRadius: 8,
  },
  photoBtnText: { fontSize: 14 },
  photoPreviewWrap: { marginTop: 12, alignItems: 'center' },
  photoPreview: { width: 120, height: 120, borderRadius: 8 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  cancelBtnText: { fontSize: 16 },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#0D9488',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
