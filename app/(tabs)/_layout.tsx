import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6200ee', headerShown: false }}>
      
      {/* Aba Home */}
      <Tabs.Screen 
        name="home" 
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }} 
      />

      {/* Aba Perfil */}
      <Tabs.Screen 
        name="perfil" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }} 
      /> 
    </Tabs>
  );
}