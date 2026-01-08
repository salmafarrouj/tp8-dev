import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Platform, Modal } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { listenToReminders, addReminderToFirestore, updateReminderInFirestore, deleteReminderFromFirestore } from "../services/firestore";
import { scheduleNotification, cancelNotification } from "../services/notifications";

export default function ReminderScreen() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [reminders, setReminders] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState("date"); // 'date' or 'time'

    useEffect(() => {
        if (!user) return;
        const unsub = listenToReminders(user.uid, setReminders);
        return () => unsub();
    }, [user]);

    const showAlert = (title, msg) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${msg}`);
        } else {
            Alert.alert(title, msg);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDate(new Date());
        setEditingId(null);
        setModalVisible(false);
        setShowPicker(false);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showAlert("Erreur", "Le titre est requis");
            return;
        }

        const notificationId = await scheduleNotification(
            "Rappel",
            title,
            date
        );

        const reminderData = {
            title,
            time: date.getTime(),
            notificationId: notificationId || null,
        };

        try {
            if (editingId) {
                // Cancel old notification if editing (simpler approach)
                const old = reminders.find(r => r.id === editingId);
                if (old?.notificationId) {
                    await cancelNotification(old.notificationId);
                }
                await updateReminderInFirestore(user.uid, editingId, reminderData);
            } else {
                await addReminderToFirestore(user.uid, reminderData);
            }
            resetForm();
        } catch (error) {
            console.error("Save Error:", error);
            showAlert("Erreur", "Impossible d'enregistrer le rappel");
        }
    };

    const handleDelete = async (id, notificationId) => {
        try {
            if (notificationId) await cancelNotification(notificationId);
            await deleteReminderFromFirestore(user.uid, id);
        } catch (error) {
            showAlert("Erreur", "Impossible de supprimer le rappel");
        }
    };

    const openEdit = (rem) => {
        setEditingId(rem.id);
        setTitle(rem.title);
        setDate(new Date(rem.time));
        setModalVisible(true);
    };

    const showDatePicker = () => {
        setPickerMode("date");
        setShowPicker(true);
    };

    const showTimePicker = () => {
        setPickerMode("time");
        setShowPicker(true);
    };

    // Helper for web input values (Local time)
    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getLocalTimeString = (d) => {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={reminders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={60} color="#999" />
                        <Text style={styles.emptyText}>Aucun rappel actif.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: theme.name === 'dark' ? '#1f1f1f' : '#fff' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={styles.cardTime}>
                                {new Date(item.time).toLocaleDateString()} à {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                            <Ionicons name="pencil" size={20} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id, item.notificationId)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.name === 'dark' ? '#222' : '#fff' }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editingId ? "Modifier le rappel" : "Nouveau rappel"}
                        </Text>

                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.name === 'dark' ? '#444' : '#ddd' }]}
                            placeholder="Nom du rappel..."
                            placeholderTextColor="#999"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            <TouchableOpacity
                                style={[styles.dateBtn, { flex: 1, borderColor: theme.name === 'dark' ? '#444' : '#ddd' }]}
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        const el = document.getElementById('web-reminder-date');
                                        if (el && el.showPicker) el.showPicker();
                                    } else {
                                        showDatePicker();
                                    }
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.text} />
                                <Text style={{ color: theme.text, marginLeft: 8, fontSize: 13 }}>
                                    {date.toLocaleDateString()}
                                </Text>
                                {Platform.OS === 'web' && (
                                    <input
                                        id="web-reminder-date"
                                        type="date"
                                        style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                                        }}
                                        value={getLocalDateString(date)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [y, m, d] = val.split('-');
                                            const newDate = new Date(date.getTime());
                                            newDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
                                            setDate(newDate);
                                        }}
                                    />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.dateBtn, { flex: 1, borderColor: theme.name === 'dark' ? '#444' : '#ddd' }]}
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        const el = document.getElementById('web-reminder-time');
                                        if (el && el.showPicker) el.showPicker();
                                    } else {
                                        showTimePicker();
                                    }
                                }}
                            >
                                <Ionicons name="time-outline" size={20} color={theme.text} />
                                <Text style={{ color: theme.text, marginLeft: 8, fontSize: 13 }}>
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {Platform.OS === 'web' && (
                                    <input
                                        id="web-reminder-time"
                                        type="time"
                                        style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                                        }}
                                        value={getLocalTimeString(date)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [h, min] = val.split(':');
                                            const newDate = new Date(date.getTime());
                                            newDate.setHours(parseInt(h), parseInt(min));
                                            setDate(newDate);
                                        }}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        {showPicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={date}
                                mode={pickerMode}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(e, d) => {
                                    setShowPicker(false);
                                    if (d) setDate(d);
                                }}
                            />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={resetForm} style={styles.cancelBtn}>
                                <Text style={{ color: '#666' }}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    actionBtn: {
        padding: 8,
        marginLeft: 5,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#2563EB',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        minHeight: 300,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 15,
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 16,
    }
});
