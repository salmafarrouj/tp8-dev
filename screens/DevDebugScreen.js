import React, { useState, useContext } from "react";
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import {
  addTodoToFirestore,
  fetchTodosFromFirestore,
} from "../services/firestore";

export default function DevDebugScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const append = (m) => setLogs((s) => [m, ...s]);

  const showEnv = () => {
    append(`API_KEY=${process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? "OK" : "MISSING"}`);
    append(`AUTH_DOMAIN=${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? "OK" : "MISSING"}`);
    append(`PROJECT_ID=${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? "OK" : "MISSING"}`);
    append(`APP_ID=${process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? "OK" : "MISSING"}`);
    append(`GOOGLE_WEB_CLIENT_ID=${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? "OK" : "MISSING"}`);
  };

  const testFirestore = async () => {
    if (!user) return append("No authenticated user — connectez-vous d'abord.");
    setLoading(true);
    try {
      append("Ajout d'une tâche de test...");
      await addTodoToFirestore(user.uid, { title: `Debug task ${Date.now()}` });
      append("Tâche ajoutée — lecture des tâches utilisateur...");
      const todos = await fetchTodosFromFirestore(user.uid);
      append(`Found ${todos.length} todos (most recent: ${todos[0]?.title ?? 'none'})`);
    } catch (e) {
      append(`Erreur Firestore: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={{ padding: 16 }}>
        <Text style={[styles.h1, { color: theme.text }]}>Debug Firebase</Text>
        <Text style={{ color: theme.text, marginBottom: 8 }}>
          Utilisateur connecté: {user ? user.email : "(aucun)"}
        </Text>

        <Button title="Afficher variables d'environnement" onPress={showEnv} />
        <View style={{ height: 10 }} />
        <Button title="Tester Firestore (ajout + lecture)" onPress={testFirestore} disabled={loading} />

        <View style={{ height: 20 }} />
        {loading && <ActivityIndicator />}

        <View style={{ marginTop: 10 }}>
          {logs.map((l, i) => (
            <Text key={i} style={{ color: theme.text, marginBottom: 6 }}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  h1: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});
