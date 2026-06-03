import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { Text } from 'react-native'
import { colors, typography } from './theme'

import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import CalibrationScreen from './screens/CalibrationScreen'
import SettingsScreen from './screens/SettingsScreen'

const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '首頁': '⊞',
    '紀錄': '☰',
    '校準': '◎',
    '設定': '⚙',
  }
  return (
    <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.gray400 }}>
      {icons[label]}
    </Text>
  )
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray400,
          tabBarLabelStyle: {
            fontSize: typography.sizes.xs,
          },
          tabBarStyle: {
            borderTopWidth: 0.5,
            borderTopColor: colors.gray200,
            height: 54,
            paddingBottom: 6,
          },
        })}
      >
        <Tab.Screen name="首頁" component={DashboardScreen} />
        <Tab.Screen name="紀錄" component={HistoryScreen} />
        <Tab.Screen name="校準" component={CalibrationScreen} />
        <Tab.Screen name="設定" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}