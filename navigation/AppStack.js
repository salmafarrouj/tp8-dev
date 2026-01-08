import { NavigationContainer } from "@react-navigation/native"; 
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import LoginScreen from "../screens/LoginScreen"; 
import AppDrawer from "./AppDrawer"; 
 
const Stack = createNativeStackNavigator(); 
 
export default function AppStack() { 
 const { user, loading } = useContext(AuthContext);
 if (loading)
   return (
     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
       <ActivityIndicator size="large" />
     </View>
   );
 
 return ( 
   <NavigationContainer> 
     <Stack.Navigator screenOptions={{ headerShown: false }}> 
       {!user ? ( 
         <Stack.Screen name="Login" component={LoginScreen} /> 
       ) : ( 
         <Stack.Screen name="App" component={AppDrawer} /> 
       )} 
     </Stack.Navigator> 
   </NavigationContainer> 
 ); 
} 
 