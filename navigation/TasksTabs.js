import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppStack from './AppStack';
import SettingScreen from '../SettingScreen';
import HomeScreen from '../HomeScreen';

const Tab = createBottomTabNavigator();

export default function TasksTabs({ initialRouteName = 'Liste' }) {
  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let icon = 'list';
          if (route.name === 'Paramètres') icon = 'settings';
          if (route.name === 'Accueil') icon = 'home';
          if (route.name === 'Liste') icon = 'list';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Liste" component={AppStack} />
      <Tab.Screen name="Paramètres" component={SettingScreen} />
    </Tab.Navigator>
  );
}
