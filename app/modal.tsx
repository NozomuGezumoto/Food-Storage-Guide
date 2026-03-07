import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useNotificationTimeStore } from '@/store/useNotificationTimeStore';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { t } from '@/utils/i18n';
import * as notifications from '@/services/notifications';
import { Text as ThemedText, View as ThemedView } from '@/components/Themed';

function clampHour(h: number): number {
  return Math.min(23, Math.max(0, Math.round(h)));
}
function clampMinute(m: number): number {
  return Math.min(59, Math.max(0, Math.round(m)));
}

export default function SettingsModal() {
  const router = useRouter();
  const { hour, minute, setTime } = useNotificationTimeStore();
  const rescheduleAllNotifications = usePurchasesStore((s) => s.rescheduleAllNotifications);
  const [localHour, setLocalHour] = useState(String(hour));
  const [localMinute, setLocalMinute] = useState(String(minute));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalHour(String(hour));
    setLocalMinute(String(minute));
  }, [hour, minute]);

  const handleSave = async () => {
    const h = clampHour(Number(localHour) || 0);
    const m = clampMinute(Number(localMinute) || 0);
    setLocalHour(String(h));
    setLocalMinute(String(m));
    setTime(h, m);
    setSaving(true);
    try {
      if (Platform.OS !== 'web') {
        await notifications.ensurePermission();
      }
      await rescheduleAllNotifications();
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.save'), t('settings.saved'));
      }
      router.back();
    } catch (e) {
      if (Platform.OS !== 'web') {
        Alert.alert(t('common.error'), String(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.section} lightColor="#ffffff" darkColor="#222">
          <ThemedText style={styles.label}>{t('settings.notificationTime')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.notificationTimeHint')}</ThemedText>
          {Constants.appOwnership === 'expo' && (
            <ThemedText style={styles.expoGoHint}>{t('settings.notificationExpoGoHint')}</ThemedText>
          )}
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={localHour}
              onChangeText={setLocalHour}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="9"
              placeholderTextColor="#999"
            />
            <Text style={styles.separator}>:</Text>
            <TextInput
              style={styles.input}
              value={localMinute}
              onChangeText={setLocalMinute}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor="#999"
            />
          </View>
        </ThemedView>
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t('common.saving') : t('settings.save')}
            </Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  hint: { fontSize: 15, opacity: 0.85, marginBottom: 14 },
  expoGoHint: { fontSize: 12, opacity: 0.75, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    width: 60,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  separator: { fontSize: 20, marginHorizontal: 8, fontWeight: '600' },
  actions: { gap: 12 },
  saveBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, color: '#666' },
});
