import { FlatList, Text, ActivityIndicator, Button } from "react-native";
import { useEffect, useState, useContext } from "react";
import { fetchTodosFetch } from "../services/api";
import { ThemeContext } from "../context/ThemeContext";
export default function TodoListFetchScreen() {
const [todos, setTodos] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const { theme, toggleTheme } = useContext(ThemeContext);
useEffect(() => {
 fetchTodosFetch()
 .then(setTodos)
 .catch(() => setError("Impossible de charger les tâches"))
 .finally(() => setLoading(false));
}, []);
if (loading) return <ActivityIndicator size="large" />;
return (
 <>
 <Button
 title={`Passer en mode ${theme === "light" ? "dark" : "light"}`}
 onPress={toggleTheme}
 />
 {error && <Text>{error}</Text>}
 <FlatList
 data={todos}
 keyExtractor={(item) => item.id.toString()}
 renderItem={({ item }) => (
 <Text
 style={{
 padding: 10,
 color: theme === "dark" ? "#ffffff" : "#000000",
 }}
 >
 {item.title}
 </Text>
 )}
 />
 </>
);
}
