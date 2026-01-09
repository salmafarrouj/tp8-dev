import React, { useEffect, useState, useContext } from "react";
import { View, Text, Button, TextInput, Alert } from "react-native";
import { useDispatch } from "react-redux"; // conservé
import { removeTodo } from "../store/todosSlice"; // conservé (appel commenté ci-dessous)
import { useTodoStore } from "../store/useTodoStore"; // Zustand
import { loadTodos, updateTodoOffline } from "../services/database";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { requestNotificationPermissionAsync, scheduleNotification, cancelNotification } from "../services/notifications";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { updateTodoInFirestore } from "../services/firestore";

export default function TodoDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { removeTodo: zRemoveTodo } = useTodoStore();
  const { mode, theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);

  const [todo, setTodo] = useState(null);
  const [title, setTitle] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await loadTodos();
      const t = all.find((x) => x.id === id);
      if (t) {
        setTodo(t);
        setTitle(t.title);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    zRemoveTodo(id);
    navigation.goBack();
  };

  const saveChanges = async () => {
    if (!todo) return;
    try {
      // update title locally
      await updateTodoOffline(id, { title });

      // if remote linked, update Firestore
      if (todo.remoteId && user) {
        await updateTodoInFirestore(user.uid, todo.remoteId, { title });
      }

      Alert.alert("Enregistré", "Modifications enregistrées");
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  const toggleReminder = async () => {
    if (!todo) return;
    try {
      if (todo.reminderAt) {
        // cancel
        if (todo.notificationId) await cancelNotification(todo.notificationId);
        await updateTodoOffline(id, { reminderAt: null, notificationId: null });
        if (todo.remoteId && user) await updateTodoInFirestore(user.uid, todo.remoteId, { reminderAt: null });
        setTodo({ ...todo, reminderAt: null, notificationId: null });
        Alert.alert("Rappel supprimé");
        return;
      }

      // schedule a reminder for 1 hour from now by default
      const when = Date.now() + 60 * 60 * 1000;
      const ok = await requestNotificationPermissionAsync();
      let notificationId = null;
      if (ok) notificationId = await scheduleNotification(title || todo.title, "Rappel tâche", when);

      await updateTodoOffline(id, { reminderAt: when, notificationId });
      if (todo.remoteId && user) await updateTodoInFirestore(user.uid, todo.remoteId, { reminderAt: when });
      setTodo({ ...todo, reminderAt: when, notificationId });
      Alert.alert("Rappel programmé", "Rappel dans 1 heure");
    } catch (e) {
      console.warn(e);
      Alert.alert("Erreur rappel", e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, color: theme.text, marginBottom: 8 }}>Détails tâche</Text>
      <TextInput value={title} onChangeText={setTitle} style={{ borderWidth: 1, padding: 10, color: theme.text, backgroundColor: theme.card }} />
      <View style={{ height: 10 }} />
      <Button title="Enregistrer" onPress={saveChanges} />
      <View style={{ height: 10 }} />
      <Button title={todo?.reminderAt ? "Supprimer le rappel" : "Programmer un rappel (1h)"} onPress={toggleReminder} />
      <View style={{ height: 10 }} />
      <Button title="Supprimer cette tâche" color="red" onPress={handleDelete} />
    </View>
  );
}
