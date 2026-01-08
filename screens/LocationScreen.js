import * as Location from "expo-location"; 
import { View, Text, Button } from "react-native"; 
import { useState } from "react"; 
import AppBar from "../components/AppBar"; 
export default function LocationScreen() { 
 const [location, setLocation] = useState(null); 
 
 const getLocation = async () => { 
   const { status } = await Location.requestForegroundPermissionsAsync(); 
   if (status !== "granted") return; 
 
   const loc = await Location.getCurrentPositionAsync({}); 
   setLocation(loc.coords); 
 }; 
 return ( 
   <View> 
     <AppBar title="Localisation" back /> 
     <Button title="Obtenir position" onPress={getLocation} /> 
     {location && ( 
       <Text> 
         Lat: {location.latitude} | Lng: {location.longitude} 
       </Text> 
     )} 
   </View> 
 ); 
}