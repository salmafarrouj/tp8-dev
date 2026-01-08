import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Button, TextInput, TouchableOpacity, Alert } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
	initDB,
	loadTodos,
	addTodoOffline,
	updateTodoOffline,
	deleteTodoOffline,
} from "../services/database";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { syncLocalToFirestore, syncFirestoreToLocal } from "../services/sync";
import { requestNotificationPermissionAsync, scheduleNotification, cancelNotification } from "../services/notifications";

export default function TodoListOfflineScreen() {
	const [todos, setTodos] = useState([]);
	const [title, setTitle] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [reminderDate, setReminderDate] = useState("");
	const [reminderTime, setReminderTime] = useState("");
	const [showReminderInputs, setShowReminderInputs] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const { mode, theme, toggleTheme } = useContext(ThemeContext);
	const { user } = useContext(AuthContext);

	const refreshTodos = async () => {
		try {
			const data = await loadTodos();
			setTodos(data);
		} catch (e) {
			console.warn("refreshTodos error:", e.message);
			setTodos([]);
		}
	};

	const handleAddOrUpdate = async () => {
		if (!title.trim()) return;
		try {
			let reminderAt = null;
			let notificationId = null;
			if (showReminderInputs && reminderDate && reminderTime) {
				const parsed = Date.parse(`${reminderDate}T${reminderTime}:00`);
				if (!isNaN(parsed)) {
					reminderAt = parsed;
					const ok = await requestNotificationPermissionAsync();
					if (ok) {
						notificationId = await scheduleNotification(title, "Rappel tâche", reminderAt);
					}
				}
			}
			if (editingId) {
				// if updating, cancel previous notification if exists
				const all = await loadTodos();
				const prev = all.find((t) => t.id === editingId);
				if (prev && prev.notificationId && prev.notificationId !== notificationId) {
					await cancelNotification(prev.notificationId);
				}
				await updateTodoOffline(editingId, { title, reminderAt, notificationId });
				setEditingId(null);
			} else {
				await addTodoOffline({ title, createdAt: Date.now(), synced: 0, reminderAt, notificationId });
			}
			setTitle("");
			setReminderDate("");
			setReminderTime("");
			setShowReminderInputs(false);
			await refreshTodos();
		} catch (e) {
			console.warn(e);
		}
	};

	const handleDelete = async (id) => {
		// cancel notification if exists
		try {
			const all = await loadTodos();
			const item = all.find((t) => t.id === id);
			if (item && item.notificationId) {
				await cancelNotification(item.notificationId);
			}
		} catch (e) {
			console.warn("handleDelete cancel error", e.message);
		}
		await deleteTodoOffline(id);
		await refreshTodos();
	};

	const handleSync = async () => {
		if (!user) return Alert.alert("Authentification requise", "Veuillez vous connecter pour synchroniser.");
		try {
			const res = await syncLocalToFirestore(user.uid);
			const ok = res.filter((r) => r.status === "synced").length;
			Alert.alert("Sync terminé", `${ok} élément(s) synchronisés`);
			await refreshTodos();
		} catch (e) {
			Alert.alert("Erreur de synchronisation", e.message);
		}
	};

	useEffect(() => {
		initDB().then(refreshTodos).catch(() => refreshTodos());
	}, []);

	return (
		<>
			<Button title={`Passer en mode ${mode === "light" ? "dark" : "light"}`} onPress={toggleTheme} />

			<View style={{ padding: 10 }}>
				<TextInput
					placeholder="Tâche offline"
					value={title}
					onChangeText={setTitle}
					style={{ borderWidth: 1, padding: 10, marginBottom: 10, color: theme.text, backgroundColor: theme.card }}
				/>
				<Button title={editingId ? "✏️ Mettre à jour" : "➕ Ajouter hors ligne"} onPress={handleAddOrUpdate} />
				<View style={{ height: 10 }} />
					<Button title="🔁 Synchroniser vers Firestore" onPress={handleSync} />
					<View style={{ height: 10 }} />
					<Button title={showReminderInputs ? "Annuler rappel" : "Définir un rappel"} onPress={() => setShowReminderInputs((s) => !s)} />
					{showReminderInputs && (
						<>
							<View style={{ height: 10 }} />
							<Button title={reminderDate ? `Date: ${reminderDate}` : "Choisir la date"} onPress={() => setShowDatePicker(true)} />
							<View style={{ height: 8 }} />
							<Button title={reminderTime ? `Heure: ${reminderTime}` : "Choisir l'heure"} onPress={() => setShowTimePicker(true)} />
							<DateTimePickerModal
								isVisible={showDatePicker}
								mode="date"
								onConfirm={(d) => {
									setShowDatePicker(false);
									setReminderDate(d.toISOString().slice(0, 10));
								}}
								onCancel={() => setShowDatePicker(false)}
							/>
							<DateTimePickerModal
								isVisible={showTimePicker}
								mode="time"
								onConfirm={(t) => {
									setShowTimePicker(false);
									const hh = t.getHours().toString().padStart(2, "0");
									const mm = t.getMinutes().toString().padStart(2, "0");
									setReminderTime(`${hh}:${mm}`);
								}}
								onCancel={() => setShowTimePicker(false)}
							/>
						</>
					)}
				<View style={{ height: 10 }} />
				<Button
					title="⬇️ Importer depuis Firestore"
					onPress={async () => {
						if (!user) return Alert.alert("Authentification requise", "Veuillez vous connecter pour importer.");
						try {
							const res = await syncFirestoreToLocal(user.uid);
							const inserted = res.filter((r) => r.status === "inserted").length;
							Alert.alert("Import terminé", `${inserted} élément(s) importés`);
							await refreshTodos();
						} catch (e) {
							Alert.alert("Erreur d'import", e.message);
						}
					}}
				/>
			</View>

			{todos.length === 0 ? (
				<Text style={{ textAlign: "center", marginTop: 20 }}>Aucune tâche disponible hors ligne</Text>
			) : (
				<FlatList
					data={todos}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<View style={{ flexDirection: "row", justifyContent: "space-between", padding: 10, backgroundColor: theme.card }}>
							<Text style={{ color: theme.text }}>{item.title}</Text>
							<View style={{ flexDirection: "row" }}>
								<TouchableOpacity
									onPress={() => {
										setTitle(item.title);
										setEditingId(item.id);
										if (item.reminderAt) {
											const d = new Date(item.reminderAt);
											setReminderDate(d.toISOString().slice(0, 10));
											setReminderTime(d.toTimeString().slice(0, 5));
											setShowReminderInputs(true);
										} else {
											setReminderDate("");
											setReminderTime("");
											setShowReminderInputs(false);
										}
									}}
									style={{ marginRight: 10 }}
								>
									<Text style={{ color: theme.primary }}>✏️</Text>
								</TouchableOpacity>
								<TouchableOpacity onPress={() => handleDelete(item.id)}>
									<Text style={{ color: "#d11" }}>🗑️</Text>
								</TouchableOpacity>
							</View>
						</View>
					)}
				/>
			)}
		</>
	);
}