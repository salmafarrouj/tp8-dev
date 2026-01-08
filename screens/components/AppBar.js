import { View, Text, Button } from "react-native";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AppBar({ title }) {
  const { logout } = useContext(AuthContext);

  return (
    <View
      style={{
        height: 60,
        backgroundColor: "#2196F3",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
      }}
    >
      <Text style={{ fontSize: 20, color: "white" }}>{title}</Text>
      <Button title="Logout" color="#fff" onPress={logout} />
    </View>
  );
}
