import React from "react";
import { View, Text } from "react-native";

export default function SettingScreen() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
			<Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 8 }}>Paramètres</Text>
			<Text style={{ fontSize: 16, color: "#555", textAlign: "center" }}>
				Espace réservé pour vos paramètres.
			</Text>
		</View>
	);
}

