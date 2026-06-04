import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { Text } from 'react-native'
import { colors, typography } from './theme'

import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import CalibrationScreen from './screens/CalibrationScreen'
import SettingsScreen from './screens/SettingsScreen'
import PreCheckScreen from './screens/PreCheckScreen'
import PreQuestionnaireScreen from './screens/PreQuestionnaireScreen'
import BrightnessCalibScreen from './screens/BrightnessCalibScreen'
import CamCaptureScreen from './screens/CamCaptureScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import ReportOverviewScreen from './screens/ReportOverviewScreen'
import RegisterScreen from './screens/RegisterScreen'
import LoginScreen from './screens/LoginScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

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

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: { fontSize: typography.sizes.xs },
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
  )
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="PreCheck" component={PreCheckScreen} />
        <Stack.Screen name="PreQuestionnaire" component={PreQuestionnaireScreen} />
        <Stack.Screen name="BrightnessCalib" component={BrightnessCalibScreen} />
        <Stack.Screen name="CamCapture" component={CamCaptureScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
        <Stack.Screen name="ReportOverview" component={ReportOverviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}