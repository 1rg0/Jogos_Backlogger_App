import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return(
    <>
      <Tabs screenOptions={{tabBarActiveTintColor:"lime"}}>
        <Tabs.Screen 
        name="home" 
        options={{
          title:"Home", 
          tabBarIcon: ({color, focused}) =>{
            return focused ?(
              <MaterialCommunityIcons name="home-circle-outline" size={24} color={color} />
            ) : (
              <MaterialCommunityIcons name="home-circle" size={24} color={color} />
            );
          },
        }}></Tabs.Screen>
      </Tabs>
    </> 
  );
}
