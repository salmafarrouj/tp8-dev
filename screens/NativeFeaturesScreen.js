import { View, Text, TouchableOpacity } from "react-native"; 
import AppBar from "../components/AppBar"; 
 
export default function NativeFeaturesScreen({ navigation }) { 
 return ( 
   <View style={{ flex: 1 }}> 
     <AppBar title="Fonctionnalités natives" /> 
 
     <TouchableOpacity onPress={() => navigation.navigate("Caméra")}> 
       <Text>
📷
 Caméra</Text> 
     </TouchableOpacity> 
 
     <TouchableOpacity onPress={() => navigation.navigate("Localisation")}> 
       <Text>
📍
 Géolocalisation</Text> 
     </TouchableOpacity> 
 
     <TouchableOpacity onPress={() => navigation.navigate("Contacts")}> 
       <Text>
👥
 Contacts</Text> 
     </TouchableOpacity> 
 
     <TouchableOpacity onPress={() => navigation.navigate("Notifications")}> 
       <Text>
🔔
 Notifications</Text> 
     </TouchableOpacity> 
   </View> 
 ); 
}