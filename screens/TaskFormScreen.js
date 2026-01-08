import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, Alert, Platform, Modal } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from "../context/AuthContext";
import { addTodoToFirestore, updateTodoInFirestore, listenToCategories, listenToUserSettings } from "../services/firestore";
import { scheduleTaskReminder, registerForPushNotificationsAsync } from "../services/notifications";
import { Ionicons } from "@expo/vector-icons";

export default function TaskFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useContext(AuthContext);

    // If editing, we get initial task data
    const editingTask = route.params?.task;
    const isEditing = !!editingTask;

    const [title, setTitle] = useState(editingTask?.title || "");
    const [description, setDescription] = useState(editingTask?.description || "");
    // Default category to 'personal' or first available
    const [category, setCategory] = useState(editingTask?.category || "personal");
    const [categories, setCategories] = useState([]);
    const [priority, setPriority] = useState(editingTask?.priority || "medium");
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const [dueDate, setDueDate] = useState(editingTask?.dueDate ? new Date(editingTask.dueDate.seconds * 1000) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hasReminder, setHasReminder] = useState(editingTask?.reminder || false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const sub = listenToCategories(user.uid, (cats) => {
            setCategories(cats);
            // If current category selection is invalid (e.g. deleted), reset to first
            if (cats.length > 0 && !cats.find(c => c.id === category)) {
                setCategory(cats[0].id);
            }
        });
        return () => sub();
    }, [user]);

    useEffect(() => {
        // Only register for push notifications on native platforms to avoid errors on Web
        if (Platform.OS !== 'web') {
            registerForPushNotificationsAsync().catch(err => console.log("Notification permissions error:", err));
        }
    }, [user]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Erreur", "Le titre est obligatoire");
            return;
        }

        setLoading(true);
        try {
            const taskData = {
                title,
                description,
                category,
                priority,
                dueDate: dueDate,
                reminder: hasReminder,
                // If editing, preserve status, else default
                status: editingTask?.status || "todo",
            };

            let savedId = editingTask?.id;

            // Firestore operations
            if (isEditing) {
                await updateTodoInFirestore(user.uid, editingTask.id, taskData);
            } else {
                const docRef = await addTodoToFirestore(user.uid, taskData);
                savedId = docRef.id;
            }

            // Message de succès immédiat
            if (Platform.OS === 'web') {
                alert("Tâche enregistrée !");
            } else {
                Alert.alert("Succès", "La tâche a été enregistrée avec succès.");
            }

            // Notifications (Skip on Web)
            if (Platform.OS !== 'web' && hasReminder && savedId) {
                try {
                    await scheduleTaskReminder({ ...taskData, id: savedId });
                } catch (notiError) {
                    console.log("Notification scheduling failed:", notiError);
                }
            }

            navigation.navigate("App", {
                screen: "Mes tâches",
                params: { lastUpdate: Date.now() }
            });
        } catch (error) {
            console.error("Save Error:", error);
            if (Platform.OS === 'web') {
                alert("Erreur d'enregistrement : " + error.message);
            } else {
                Alert.alert("Erreur", "Impossible d'enregistrer la tâche. Vérifiez votre connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(Platform.OS === 'ios');
        setDueDate(currentDate);
    };

    return (
        <View style={styles.container}>
            <PermissionsHeader title={isEditing ? "Modifier la tâche" : "Nouvelle tâche"} navigation={navigation} />

            <ScrollView style={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Titre</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Faire les courses"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Détails supplémentaires..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <View style={styles.rowLabel}>
                        <Text style={styles.label}>Catégorie</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("CategoryManager")}>
                            <Text style={{ color: "#2563EB", fontWeight: "600" }}>Gérer</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.catButton,
                                    category === cat.id && { backgroundColor: cat.color || '#333', borderColor: cat.color || '#333' },
                                    category !== cat.id && { borderColor: '#ddd' }
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                                <Text style={[
                                    styles.catText,
                                    category === cat.id ? { color: "#fff" } : { color: "#333" }
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Priorité</Text>
                    <View style={styles.priorityContainer}>
                        {['low', 'medium', 'high'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityChip,
                                    priority === p && styles.priorityChipSelected,
                                    priority === p && { backgroundColor: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981' }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[
                                    styles.priorityText,
                                    priority === p && { color: '#fff' }
                                ]}>
                                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : 'Haute'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Échéance</Text>

                    {/* Web Date Picker Logic */}
                    {Platform.OS === 'web' ? (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.dateButton, { flex: 1 }]}
                                onPress={() => {
                                    const input = document.getElementById('web-task-date');
                                    if (input && input.showPicker) input.showPicker();
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#333" style={{ marginRight: 8 }} />
                                <Text style={styles.dateText}>
                                    {dueDate ? dueDate.toLocaleDateString() : 'Date'}
                                </Text>
                                <input
                                    id="web-task-date"
                                    type="date"
                                    style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                                    }}
                                    value={dueDate ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}` : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const [y, m, d] = val.split('-');
                                        const newDate = new Date((dueDate || new Date()).getTime());
                                        newDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
                                        setDueDate(newDate);
                                    }}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.dateButton, { flex: 1 }]}
                                onPress={() => {
                                    const input = document.getElementById('web-task-time');
                                    if (input && input.showPicker) input.showPicker();
                                }}
                            >
                                <Ionicons name="time-outline" size={20} color="#333" style={{ marginRight: 8 }} />
                                <Text style={styles.dateText}>
                                    {dueDate ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Heure'}
                                </Text>
                                <input
                                    id="web-task-time"
                                    type="time"
                                    style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        opacity: 0, width: '100%', height: '100%', cursor: 'pointer'
                                    }}
                                    value={dueDate ? `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}` : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const [h, min] = val.split(':');
                                        const newDate = new Date((dueDate || new Date()).getTime());
                                        newDate.setHours(parseInt(h), parseInt(min));
                                        setDueDate(newDate);
                                    }}
                                />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#333" style={{ marginRight: 10 }} />
                                <Text style={styles.dateText}>
                                    {dueDate ? `${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Choisir date & heure'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={dueDate || new Date()}
                                    mode="datetime"
                                    is24Hour={true}
                                    display="default"
                                    onChange={onChangeDate}
                                />
                            )}
                        </>
                    )}
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Rappel</Text>
                    <Switch
                        value={hasReminder}
                        onValueChange={setHasReminder}
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    <Text style={styles.saveButtonText}>{loading ? "Enregistrement..." : "Enregistrer"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const PermissionsHeader = ({ title, navigation }) => (
    <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 40,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
    },
    input: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    rowLabel: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8
    },
    catScroll: {
        flexDirection: "row",
    },
    catButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: "#fff"
    },
    catDot: {
        width: 10, height: 10, borderRadius: 5, marginRight: 8
    },
    catText: {
        fontWeight: "600",
        fontSize: 14,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: 12,
        borderRadius: 8,
    },
    dateText: {
        marginLeft: 10,
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    saveButton: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    priorityChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    priorityChipSelected: {
        borderColor: 'transparent',
    },
    priorityText: {
        fontWeight: '600',
        color: '#555',
    },
});
