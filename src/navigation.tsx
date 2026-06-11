import { SafeAreaView } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import { Text } from 'react-native'
import { colors, typography } from './theme'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'


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
import QCFailScreen from './screens/QCFailScreen'
import ClinicListScreen from './screens/ClinicListScreen'
import ProfileScreen from './screens/ProfileScreen'
import PlanScreen from './screens/PlanScreen'
import ClinicAddScreen from './screens/ClinicAddScreen'
import ClinicQRScreen from './screens/ClinicQRScreen'
import ClinicCodeScreen from './screens/ClinicCodeScreen'
import ClinicSearchScreen from './screens/ClinicSearchScreen'
import ConsentScreen from './screens/ConsentScreen'
import ClinicConfirmScreen from './screens/ClinicConfirmScreen'
import ClinicSuccessScreen from './screens/ClinicSuccessScreen'
import ShareRecordScreen from './screens/ShareRecordScreen'
import ShareSentScreen from './screens/ShareSentScreen'
import ReportLinkScreen from './screens/ReportLinkScreen'
import AIAdviceScreen from './screens/AIAdviceScreen'
import AIChatScreen from './screens/AIChatScreen'
import WhiteCaptureScreen from './screens/WhiteCaptureScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import VerifyEmailScreen from './screens/VerifyEmailScreen'
import LotQRScreen from './screens/LotQRScreen'
import ShopScreen from './screens/ShopScreen'
import OrderConfirmScreen from './screens/OrderConfirmScreen'



const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? colors.primary : colors.gray400
  const size = 26

  switch (label) {
    case '首頁': return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
    case '紀錄': return <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
    case '校準': return <Ionicons name={focused ? 'scan-circle' : 'scan-circle-outline'} size={size} color={color} />
    case '商店': return <Ionicons name={focused ? 'bag' : 'bag-outline'} size={size} color={color} />
    case '設定': return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
    default: return null
  }
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
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: colors.gray200,
          height: 80,
          paddingBottom: 8,
          paddingTop: 6,
        },
      })}
    >
      <Tab.Screen name="首頁" component={DashboardScreen} />
      <Tab.Screen name="紀錄" component={HistoryScreen} />
      <Tab.Screen name="校準" component={CalibrationScreen} />
      <Tab.Screen name="商店" component={ShopScreen} />
      <Tab.Screen name="設定" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export default function Navigation({ onLogin }: any) {
  const [initialRoute, setInitialRoute] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('isLoggedIn').then(val => {
      setInitialRoute(val === 'true' ? 'Main' : 'Login')
    })
  }, [])

  if (!initialRoute) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { paddingTop: 50 } }} initialRouteName={initialRoute}>
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={onLogin} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="PreCheck" component={PreCheckScreen} />
        <Stack.Screen name="PreQuestionnaire" component={PreQuestionnaireScreen} />
        <Stack.Screen name="BrightnessCalib" component={BrightnessCalibScreen} />
        <Stack.Screen name="CamCapture" component={CamCaptureScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
        <Stack.Screen name="ReportOverview" component={ReportOverviewScreen} />
        <Stack.Screen name="QCFail" component={QCFailScreen} />
        <Stack.Screen name="ClinicList" component={ClinicListScreen} />
        <Stack.Screen name="ClinicAdd" component={ClinicAddScreen} />
        <Stack.Screen name="ClinicQR" component={ClinicQRScreen} />
        <Stack.Screen name="ClinicCode" component={ClinicCodeScreen} />
        <Stack.Screen name="ClinicSearch" component={ClinicSearchScreen} />
        <Stack.Screen name="Consent" component={ConsentScreen} />
        <Stack.Screen name="ClinicConfirm" component={ClinicConfirmScreen} />
        <Stack.Screen name="ClinicSuccess" component={ClinicSuccessScreen} />
        <Stack.Screen name="ShareRecord" component={ShareRecordScreen} />
        <Stack.Screen name="ShareSent" component={ShareSentScreen} />
        <Stack.Screen name="ReportLink" component={ReportLinkScreen} />
        <Stack.Screen name="AIAdvice" component={AIAdviceScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="WhiteCapture" component={WhiteCaptureScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="LotQR" component={LotQRScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}