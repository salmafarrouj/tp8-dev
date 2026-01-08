import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FonctionnalitesNatives from "../screens/FonctionnalitesNatives";

const Stack = createNativeStackNavigator();

export default function NativeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FonctionnalitesNatives"
        component={FonctionnalitesNatives}
        options={{ title: "Fonctionnalités natives" }}
      />
    </Stack.Navigator>
  );
}
