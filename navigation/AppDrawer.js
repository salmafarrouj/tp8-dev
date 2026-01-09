import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DevDebugScreen from "../screens/DevDebugScreen";
 
const Drawer = createDrawerNavigator(); 
 
export default function AppDrawer() { 
 return ( 
   <Drawer.Navigator screenOptions={{ headerShown: true }}> 
      <Drawer.Screen name="Mes tâches" component={HomeScreen} />
      <Drawer.Screen name="Profil" component={ProfileScreen} />
      <Drawer.Screen name="Debug" component={DevDebugScreen} />
   </Drawer.Navigator> 
 ); 
}
