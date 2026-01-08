import { ThemeProvider } from "./context/ThemeContext"; 
import { AuthProvider } from "./context/AuthContext"; 
import AppStack from "./navigation/AppStack"; 
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet, ActivityIndicator } from "react-native";
function MainApp() {
const { theme } = useContext(ThemeContext);
return (
 <View
 style={[
 styles.container,
 theme === "dark" ? styles.dark : styles.light,
 ]}
 >
 <TodoListOfflineScreen />
 </View>
);
}
export default function App() { 
 return ( 
   <SafeAreaProvider> 
     <ThemeProvider> 
       <AuthProvider> 
         <AppStack /> 
       </AuthProvider> 
     </ThemeProvider> 
   </SafeAreaProvider> 
 ); 
} 
const styles = StyleSheet.create({
container: {
 flex: 1,
 paddingTop: 40,
},
light: {
 backgroundColor: "#ffffff",
},
dark: {
 backgroundColor: "#121212",
},
})