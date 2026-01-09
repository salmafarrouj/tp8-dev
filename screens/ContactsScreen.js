import * as Contacts from "expo-contacts"; 
import { View, Text, Button, FlatList } from "react-native"; 
import { useState } from "react"; 
import AppBar from "../components/AppBar"; 
 
export default function ContactsScreen() { 
 const [contacts, setContacts] = useState([]); 
 
 const loadContacts = async () => { 
   const { status } = await Contacts.requestPermissionsAsync(); 
   if (status !== "granted") return; 
 
   const { data } = await Contacts.getContactsAsync({ 
     fields: [Contacts.Fields.Name], 
   }); 
   setContacts(data); 
 }; 
 
 return ( 
   <View> 
     <AppBar title="Contacts" back /> 
     <Button title="Charger contacts" onPress={loadContacts} /> 
     <FlatList 
       data={contacts} 
       keyExtractor={(item) => item.id} 
       renderItem={({ item }) => <Text>{item.name}</Text>} 
     /> 
   </View> 
 ); 
} 
