import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { listenToCategories, addCategoryToFirestore, deleteCategoryFromFirestore, updateCategoryInFirestore } from "../services/firestore";
import { Ionicons } from "@expo/vector-icons";

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#64748B', '#000000'
];

export default function CategoryManagerScreen() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigation = useNavigation();

    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Set navigation header options
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => {
                    setEditingCategory(null);
                    setNewCatName("");
                    setSelectedColor(COLORS[0]);
                    setShowAddModal(true);
                }} style={{ marginRight: 15 }}>
                    <Ionicons name="add" size={28} color="#2563EB" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = listenToCategories(user.uid, setCategories);
        return () => unsubscribe();
    }, [user]);

    const handleSaveCategory = async () => {
        if (!newCatName.trim()) {
            Alert.alert("Erreur", "Le nom de la catégorie est requis");
            return;
        }
        try {
            if (editingCategory) {
                await updateCategoryInFirestore(user.uid, editingCategory.id, {
                    name: newCatName.trim(),
                    color: selectedColor
                });
            } else {
                await addCategoryToFirestore(user.uid, newCatName.trim(), selectedColor);
            }
            setNewCatName("");
            setEditingCategory(null);
            setShowAddModal(false);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible d'enregistrer la catégorie");
        }
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setNewCatName(cat.name);
        setSelectedColor(cat.color || COLORS[0]);
        setShowAddModal(true);
    };

    const handleDelete = (cat) => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                deleteCategoryFromFirestore(user.uid, cat.id);
            }
        } else {
            Alert.alert(
                "Supprimer",
                `Supprimer la catégorie "${cat.name}" ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => deleteCategoryFromFirestore(user.uid, cat.id)
                    }
                ]
            );
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={styles.catName}>{item.name}</Text>

            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={18} color="#6366F1" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* List Categories */}
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />

            {/* Add Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingCategory ? "Modifier" : "Nouvelle"} Catégorie</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom (ex: Sport, Travail...)"
                            value={newCatName}
                            onChangeText={setNewCatName}
                        />

                        <Text style={styles.label}>Couleur</Text>
                        <View style={styles.colorGrid}>
                            {COLORS.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: c },
                                        selectedColor === c && styles.selectedColor
                                    ]}
                                    onPress={() => setSelectedColor(c)}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                                <Text style={{ color: '#666' }}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveCategory} style={styles.addBtn}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editingCategory ? "Enregistrer" : "Ajouter"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3F4F6" },
    list: { padding: 20 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 16, borderRadius: 12, marginBottom: 12
    },
    colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
    catName: { flex: 1, fontSize: 16, fontWeight: '600' },
    iconBtn: { padding: 8, marginLeft: 4 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 20 },
    label: { marginBottom: 10, fontWeight: '600' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    colorOption: { width: 32, height: 32, borderRadius: 16, margin: 6 },
    selectedColor: { borderWidth: 3, borderColor: '#333' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelBtn: { padding: 12 },
    addBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8 }
});
