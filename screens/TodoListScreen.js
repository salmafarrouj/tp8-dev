import { View, Text, FlatList, Button, TextInput } from "react-native"; 
import { useEffect, useContext, useState } from "react"; 
import { useTodoStore } from "../store/useTodoStore"; 
import { AuthContext } from "../context/AuthContext"; 
import AppBar from "../components/AppBar"; 
 
export default function TodoListScreen() { 
 const { user } = useContext(AuthContext); 
 const { todos, loadTodos, addTodo } = useTodoStore();
  const [title, setTitle] = useState(""); 
 
 useEffect(() => { 
   if (user) { 
     loadTodos(user.uid); 
   } 
 }, [user]); 
 
 const handleAddTodo = () => { 
   if (!title.trim()) return; 
 
   addTodo(user.uid, title); 
   setTitle(""); 
 }; 
 
 return ( 
   <View style={{ flex: 1 }}> 
     <AppBar title="Mes tâches" /> 
 
     {/* Champ de saisie */} 
     <View style={{ padding: 15 }}> 
       <TextInput 
         placeholder="Nouvelle tâche..." 
         value={title} 
         onChangeText={setTitle} 
         style={{ 
           borderWidth: 1, 
           borderColor: "#ccc", 
           padding: 10, 
           borderRadius: 6, 
           marginBottom: 10, 
         }} 
       /> 
 
       <Button title="Ajouter la tâche" onPress={handleAddTodo} /> 
     </View> 
 
     {/* Liste */} 
     <FlatList 
       data={todos} 
       keyExtractor={(i) => i.id.toString()} 
       renderItem={({ item }) => ( 
         <Text style={{ padding: 15, fontSize: 16 }}> 
           • {item.title} 
         </Text> 
           )} 
     /> 
   </View> 
 ); 
}
