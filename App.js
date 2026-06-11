import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen  from './src/screens/DashboardScreen';
import HomeScreen       from './src/screens/HomeScreen';
import RecipesScreen    from './src/screens/RecipesScreen';
import ChatScreen       from './src/screens/ChatScreen';
import ScanScreen       from './src/screens/ScanScreen';
import WorkoutScreen    from './src/screens/WorkoutScreen';
import ProfileScreen    from './src/screens/ProfileScreen';
import HistoryScreen    from './src/screens/HistoryScreen';
import CalendarScreen   from './src/screens/CalendarScreen';

const Tab   = createBottomTabNavigator();

const TABS = [
  { name: 'בית',     component: DashboardScreen, icon: 'home-outline',       activeIcon: 'home' },
  { name: 'תזונה',   component: HomeScreen,      icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { name: 'צאט',    component: ChatScreen,       icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { name: 'סריקה',  component: ScanScreen,       icon: 'scan-outline',       activeIcon: 'scan' },
  { name: 'אימון',  component: WorkoutScreen,    icon: 'barbell-outline',    activeIcon: 'barbell' },
  { name: 'פרופיל', component: ProfileScreen,    icon: 'person-outline',     activeIcon: 'person' },
];

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0e0e0e',
            borderTopColor: '#1a1a1a',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 6,
          },
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
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
