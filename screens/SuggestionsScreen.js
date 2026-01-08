import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { listenToUserSettings } from "../services/firestore";

const EMPTY_DAY_IDEAS = [
    { name: "Lecture", icon: "book-outline", color: "#3B82F6" },
    { name: "Méditation", icon: "sunny-outline", color: "#EC4899" },
    { name: "Cuisine", icon: "restaurant-outline", color: "#F59E0B" },
    { name: "Jardinage", icon: "leaf-outline", color: "#22C55E" },
    { name: "Rangement", icon: "briefcase-outline", color: "#64748B" },
    { name: "Podcast", icon: "headset-outline", color: "#8B5CF6" },
];

const WEEKEND_IDEAS = [
    { name: "Cinéma", icon: "film-outline", color: "#EF4444" },
    { name: "Piscine", icon: "water-outline", color: "#06B6D4" },
    { name: "Marche", icon: "walk-outline", color: "#10B981" },
    { name: "Musée", icon: "image-outline", color: "#8B5CF6" },
    { name: "Restaurant", icon: "pizza-outline", color: "#F97316" },
    { name: "Sortie Velo", icon: "bicycle-outline", color: "#10B981" },
];

export default function SuggestionsScreen() {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const [userActivities, setUserActivities] = useState([]);

    useEffect(() => {
        if (!user) return;
        const unsub = listenToUserSettings(user.uid, (settings) => {
            setUserActivities(settings.activities || []);
        });
        return () => unsub();
    }, [user]);

    // Simple logic to distribute user hobbies
    const emptyDayUserActivities = userActivities.filter(act =>
        ['Détente', 'Apprentissage', 'Ménager'].includes(act.type) || act.name.length % 2 === 0
    );
    const weekendUserActivities = userActivities.filter(act =>
        !emptyDayUserActivities.includes(act)
    );

    const IdeaCard = ({ idea, isUserHobby = false }) => (
        <View style={[styles.card, { backgroundColor: isUserHobby ? '#EDE9FE' : (theme.name === 'dark' ? '#1f1f1f' : '#fff'), borderColor: isUserHobby ? '#8B5CF6' : '#eee' }]}>
            <Ionicons name={idea.icon || "star"} size={24} color={idea.color || "#8B5CF6"} />
            <Text style={[styles.cardTitle, { color: isUserHobby ? '#6D28D9' : theme.text }]}>{idea.name}</Text>
            {isUserHobby && <Text style={styles.cardType}>{idea.type}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.headerBox}>
                    <Ionicons name="bulb" size={60} color="#F59E0B" />
                    <Text style={[styles.title, { color: theme.text }]}>Besoin d'inspiration ?</Text>
                    <Text style={styles.subtitle}>Découvrez des activités selon votre temps libre.</Text>
                </View>

                {/* --- Section JOUR VIDE --- */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="calendar-clear-outline" size={24} color="#3B82F6" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Pour une journée vide (Semaine)</Text>
                </View>
                <View style={styles.grid}>
                    {EMPTY_DAY_IDEAS.map((idea) => <IdeaCard key={idea.name} idea={idea} />)}
                    {emptyDayUserActivities.map((act) => <IdeaCard key={act.id} idea={act} isUserHobby />)}
                </View>

                {/* --- Section WEEKEND --- */}
                <View style={styles.sectionHeader}>
                    <Ionicons name="sunny-outline" size={24} color="#F59E0B" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Pour votre Week-end</Text>
                </View>
                <View style={styles.grid}>
                    {WEEKEND_IDEAS.map((idea) => <IdeaCard key={idea.name} idea={idea} />)}
                    {weekendUserActivities.map((act) => <IdeaCard key={act.id} idea={act} isUserHobby />)}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 20,
    },
    headerBox: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 30,
    },
    card: {
        width: '47%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 100,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center',
    },
    cardType: {
        fontSize: 11,
        opacity: 0.6,
        marginTop: 2,
    },
});
