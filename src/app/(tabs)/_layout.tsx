import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useTheme } from '@/theme/useTheme';

/** Three places, always one tap away: your screen time, focus help, and the bigger picture. */
export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'none' }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="tools" options={{ title: 'Focus' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Insights' }} />
    </Tabs>
  );
}
