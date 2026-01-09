import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchTodosFromFirestore,
  addTodoToFirestore,
  updateTodoInFirestore,
  deleteTodoFromFirestore,
} from "../services/firestore";
 
export default function HomeScreen() {
  const { theme, toggleTheme, mode } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  const [todos, setTodos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodo, setNewTodo] = useState("");

  const loadTodos = async () => {
    if (!user) return setTodos([]);
    try {
      const data = await fetchTodosFromFirestore(user.uid);
      setTodos(data);
    } catch (e) {
      console.warn("Erreur loadTodos:", e.message);
      setTodos([]);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [user]);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await addTodoToFirestore(user.uid, { title: newTodo });
      setNewTodo("");
      setModalVisible(false);
      await loadTodos();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter la tâche");
    }
  };

  const toggleComplete = async (item) => {
    try {
      await updateTodoInFirestore(user.uid, item.id, { completed: !item.completed });
      await loadTodos();
    } catch (e) {
      console.warn(e);
    }
  };

  const removeTodo = async (id) => {
    try {
      await deleteTodoFromFirestore(user.uid, id);
      await loadTodos();
    } catch (e) {
      console.warn(e);
    }
  };
 
 return ( 
   <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}> 
     <View style={{ padding: 16 }}> 
       <Text style={{ color: theme.text, fontSize: 26, fontWeight: "bold" }}> 
         Mes tâches 
       </Text> 
 
       <TouchableOpacity onPress={toggleTheme}> 
         <Text style={{ color: theme.primary }}>Changer thème</Text> 
       </TouchableOpacity> 
 
       <TouchableOpacity onPress={logout}> 
         <Text style={{ color: "red" }}>Déconnexion</Text> 
       </TouchableOpacity> 
 
       <TouchableOpacity 
         style={{ 
           marginVertical: 15, 
           backgroundColor: theme.primary, 
           padding: 12, 
           borderRadius: 8, 
         }} 
         onPress={() => setModalVisible(true)} 
       > 
         <Text style={{ color: "#fff", textAlign: "center" }}> 
           + Ajouter une tâche 
         </Text> 
       </TouchableOpacity> 
 
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: theme.card,
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={() => toggleComplete(item)}>
              <Text style={{ color: item.completed ? "#4caf50" : theme.text }}>
                {item.completed ? "✅ " : "⬜️ "}{item.title}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTodo(item.id)}>
              <Text style={{ color: "#d11" }}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      />
     </View> 
 
     {/* MODAL FORM */} 
     <Modal visible={modalVisible} animationType="slide" transparent> 
       <View 
         style={{ 
           flex: 1, 
           backgroundColor: "rgba(0,0,0,0.5)", 
           justifyContent: "center", 
           padding: 20, 
         }} 
       > 
         <View 
           style={{ 
             backgroundColor: theme.background, 
             padding: 20, 
             borderRadius: 10, 
           }} 
         > 
           <Text style={{ color: theme.text, fontSize: 18 }}> 
             Nouvelle tâche 
           </Text> 
 
           <TextInput 
             placeholder="Titre de la tâche" 
             value={newTodo} 
             onChangeText={setNewTodo} 
             style={{ 
               borderWidth: 1, 
               borderColor: "#ccc", 
               marginVertical: 10, 
               padding: 10, 
               borderRadius: 6, 
               color: theme.text, 
             }} 
           /> 
 
           <TouchableOpacity 
             onPress={addTodo} 
             style={{ 
               backgroundColor: theme.primary, 
               padding: 10, 
               borderRadius: 6, 
             }} 
           > 
             <Text style={{ color: "#fff", textAlign: "center" }}> 
               Ajouter 
             </Text> 
           </TouchableOpacity> 
 
           <TouchableOpacity onPress={() => setModalVisible(false)}> 
             <Text style={{ textAlign: "center", marginTop: 10 }}> 
               Annuler 
             </Text> 
           </TouchableOpacity> 
         </View> 
       </View> 
     </Modal> 
   </SafeAreaView> 
 ); 
}