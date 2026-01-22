import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

const COLORS = {
    background: '#363B4E',
    tabBarBg: '#20232E',
    active: '#C4BBF0',
    inactive: '#606470',
    border: '#2C303E'
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBarBg,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 100 : 90,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
                <Ionicons 
                    name={focused ? "game-controller" : "game-controller-outline"} 
                    size={24} 
                    color={color} 
                />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
                <Ionicons 
                    name={focused ? "trophy" : "trophy-outline"} 
                    size={24} 
                    color={color} 
                />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
                <Ionicons 
                    name={focused ? "person" : "person-outline"} 
                    size={24} 
                    color={color} 
                />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}