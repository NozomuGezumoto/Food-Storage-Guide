import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import type { PurchaseItem } from '@/types';
import { isDisplayablePhotoUri } from '@/utils/photoUtils';
import { t } from '@/utils/i18n';

interface MemoPhotoModalProps {
  visible: boolean;
  item: PurchaseItem | null;
  onClose: () => void;
}

export default function MemoPhotoModal({ visible, item, onClose }: MemoPhotoModalProps) {
  const { width } = useWindowDimensions();
  const imageSize = Math.min(width - 48, 320);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [item?.id]);

  if (!item) return null;

  const hasMemo = !!item.memo?.trim();
  const hasPhoto = !!item.photoUri;
  const canDisplayPhoto = hasPhoto && isDisplayablePhotoUri(item.photoUri) && !photoError;
  const hasAny = hasMemo || hasPhoto;

  if (!hasAny) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{item.foodName}</Text>
          <ScrollView style={styles.scroll} bounces={false}>
            {hasMemo && (
              <View style={styles.memoBlock}>
                {item.memo?.trim() ? (
                  <>
                    <Text style={styles.memoLabel}>{t('memoPhoto.label.memo')}</Text>
                    <Text style={styles.memoText}>{item.memo.trim()}</Text>
                  </>
                ) : null}
              </View>
            )}
            {hasPhoto && (
              <View style={styles.photoBlock}>
                {canDisplayPhoto ? (
                  <Image
                    source={{ uri: item.photoUri }}
                    style={[styles.photo, { width: imageSize, height: imageSize }]}
                    resizeMode="contain"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <Text style={styles.photoUnavailable}>
                    {t('common.image.unavailable')}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 18 },
  scroll: { maxHeight: 400 },
  memoBlock: { marginBottom: 16 },
  memoLabel: { fontSize: 14, opacity: 0.85, marginBottom: 6 },
  memoText: { fontSize: 17, lineHeight: 26, marginBottom: 14 },
  photoBlock: { alignItems: 'center', marginVertical: 8 },
  photo: { borderRadius: 8 },
  photoUnavailable: { fontSize: 14, color: '#888', marginVertical: 16 },
  closeBtn: {
    marginTop: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 8,
  },
  closeBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
