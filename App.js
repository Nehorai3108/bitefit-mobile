import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ScanScreen from './src/screens/ScanScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'בית',    component: DashboardScreen, icon: 'home-outline',        activeIcon: 'home' },
  { name: 'תזונה',  component: HomeScreen,      icon: 'restaurant-outline',  activeIcon: 'restaurant' },
  { name: 'צאט',   component: ChatScreen,       icon: 'chatbubble-outline',  activeIcon: 'chatbubble' },
  { name: 'סריקה', component: ScanScreen,       icon: 'scan-outline',        activeIcon: 'scan' },
  { name: 'אימון', component: WorkoutScreen,    icon: 'barbell-outline',     activeIcon: 'barbell' },
  { name: 'פרופיל',component: ProfileScreen,    icon: 'person-outline',      activeIcon: 'person' },
];

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: { backgroundColor: '#0e0e0e', borderTopColor: '#1a1a1a', borderTopWidth: 1, height: 64, paddingBottom: 10, paddingTop: 6 },
            tabBarActiveTintColor: '#4F8EF7',
            tabBarInactiveTintColor: '#444',
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? tab?.activeIcon : tab?.icon} size={23} color={color} />
            ),
          };
        }}
      >
        {TABS.map(tab => (
          <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
