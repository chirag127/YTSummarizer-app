import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SummaryScreen from '../screens/SummaryScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import constants
import { SCREENS, COLORS, TAB_ICONS } from '../constants';

// Create navigators
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Home stack navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name={SCREENS.HOME} 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name={SCREENS.SUMMARY} 
        component={SummaryScreen}
        options={{ title: 'Summary' }}
      />
    </HomeStack.Navigator>
  );
};

// Main tab navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = TAB_ICONS[route.name] || 'help-circle';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          headerShown: route.name !== SCREENS.HOME,
        })}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStackNavigator} 
          options={{ 
            headerShown: false,
            title: 'Home',
          }}
        />
        <Tab.Screen 
          name={SCREENS.HISTORY} 
          component={HistoryScreen}
          options={{ title: 'History' }}
        />
        <Tab.Screen 
          name={SCREENS.SETTINGS} 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
