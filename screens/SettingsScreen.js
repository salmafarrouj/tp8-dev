import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { listenToUserSettings, updateUserSettings } from "../services/firestore";
import { ThemeContext } from "../context/ThemeContext";

export default function SettingsScreen() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    const [activities, setActivities] = useState([]); // Array of { name, type }
    const [newActivity, setNewActivity] = useState({ name: '', type: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = listenToUserSettings(user.uid, (settings) => {
            setActivities(settings.activities || []);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);


    const addActivity = async () => {
        if (!newActivity.name || !newActivity.type) {
            Alert.alert("Erreur", "Veuillez remplir le nom et le type");
            return;
        }
        const updated = [...activities, { ...newActivity, id: Date.now() }];
        // Optimistic update if needed, but onSnapshot handles it
        try {
            await updateUserSettings(user.uid, { activities: updated });
            setNewActivity({ name: '', type: '' });
        } catch (error) {
            Alert.alert("Erreur", "Impossible d'ajouter l'activité");
        }
    };

    const removeActivity = async (id) => {
        const updated = activities.filter(a => a.id !== id);
        try {
            await updateUserSettings(user.uid, { activities: updated });
        } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer l'activité");
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.section, { backgroundColor: theme.name === 'dark' ? '#1f1f1f' : '#fff' }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Ma Liste d'Activités</Text>
                <Text style={[styles.label, { color: theme.text, marginBottom: 15 }]}>
                    Ajoutez vos sports et loisirs préférés.
                </Text>

                {/* Add Activity Form */}
                <View style={[styles.addActivityBox, { backgroundColor: theme.name === 'dark' ? '#333' : '#f9f9f9', flexDirection: 'column', gap: 10 }]}>
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                        <TextInput
                            style={[styles.miniInput, { color: theme.text }]}
                            placeholder="Activité (ex: Tennis)"
                            placeholderTextColor="#999"
                            value={newActivity.name}
                            onChangeText={(t) => setNewActivity({ ...newActivity, name: t })}
                        />
                        <TextInput
                            style={[styles.miniInput, { color: theme.text }]}
                            placeholder="Type (ex: Sport)"
                            placeholderTextColor="#999"
                            value={newActivity.type}
                            onChangeText={(t) => setNewActivity({ ...newActivity, type: t })}
                        />
                    </View>
                    <TouchableOpacity style={[styles.addBtn, { width: '100%', paddingVertical: 10 }]} onPress={addActivity}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            <Ionicons name="add-circle" size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ajouter</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Activity List */}
                {activities.map((item) => (
                    <View key={item.id} style={[styles.activityItem, { borderBottomColor: theme.name === 'dark' ? '#333' : '#eee' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.activityName, { color: theme.text }]}>{item.name}</Text>
                            <Text style={styles.activityMeta}>{item.type}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeActivity(item.id)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>


            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 30,
        padding: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    addActivityBox: {
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 15,
    },
    miniInput: {
        flex: 1,
        fontSize: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
    },
    addBtn: {
        backgroundColor: '#2563EB',
        borderRadius: 6,
        padding: 6,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    activityName: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    activityMeta: {
        fontSize: 12,
        color: '#666',
    },
});
