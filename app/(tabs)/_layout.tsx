import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { t } from '@/utils/i18n';

function SettingsButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? 'light'].text;
  return (
    <Pressable onPress={() => router.push('/modal')} style={{ padding: 8, marginRight: 8 }}>
      <Ionicons name="settings-outline" size={24} color={color} />
    </Pressable>
  );
}

function TabIconHome({ color }: { color: string }) {
  return <Ionicons name="list" size={24} color={color} />;
}

function TabIconSearch({ color }: { color: string }) {
  return <Ionicons name="search" size={24} color={color} />;
}

function TabIconHistory({ color }: { color: string }) {
  return <Ionicons name="time" size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          marginBottom: 0,
          paddingRight: 20,
          width: '100%',
          boxSizing: 'border-box',
        },
      }}
      initialRouteName="home">
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.list'),
          tabBarIcon: ({ color }) => <TabIconHome color={color} />,
          headerRight: () => <SettingsButton />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <TabIconSearch color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color }) => <TabIconHistory color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
