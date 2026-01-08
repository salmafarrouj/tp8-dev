import { CameraView, useCameraPermissions } from "expo-camera"; 
import { View, Text, Button, StyleSheet } from "react-native"; 
import { useRef } from "react"; 
import AppBar from "../components/AppBar"; 
 
export default function CameraScreen({ navigation }) { 
 const [permission, requestPermission] = useCameraPermissions(); 
 const cameraRef = useRef(null); 
 
 if (!permission) return <Text>Chargement...</Text>; 
 
 // Permission refusée définitivement 
 if (!permission.granted && !permission.canAskAgain) { 
   return ( 
     <View style={styles.center}> 
       <AppBar title="Caméra" back /> 
       <Text>Accès caméra refusé</Text> 
       <Button title="Ouvrir les paramètres" onPress={() => Linking.openSettings()} 
/> 
     </View> 
   ); 
 } 
 // Permission non accordée 
 if (!permission.granted) { 
   return ( 
     <View style={styles.center}> 
       <AppBar title="Caméra" back /> 
       <Text>Accès caméra requis</Text> 
       <Button title="Autoriser" onPress={requestPermission} /> 
     </View> 
   ); 
 } 
 return ( 
   <View style={{ flex: 1 }}> 
     <AppBar title="Caméra" back /> 
 
     <CameraView 
       ref={cameraRef} 
       style={{ flex: 1 }} 
     /> 
 
     <View style={styles.controls}> 
       <Button title="
⬅
 Retour" color="gray" onPress={() => navigation.goBack()} 
/> 
     </View> 
   </View> 
 ); 
} 
const styles = StyleSheet.create({ 
 center: { 
   flex: 1, 
   justifyContent: "center", 
   alignItems: "center", 
 }, 
 controls: { 
   padding: 15, 
   flexDirection: "row", 
   justifyContent: "space-around", 
   backgroundColor: "#fff", 
 }, 
}); 