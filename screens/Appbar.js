import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AppBar() {
    return (
        <SafeAreaView style={{ backgroundColor: '#007AFF' }}>
            <View style={styles.appBar}>
                <Text style={styles.title}>Mon Application</Text>
            </View>
        </SafeAreaView>
    );
}

export default AppBar;
const styles = StyleSheet.create({
appBar: {
height: 60,
backgroundColor: '#007AFF', // couleur de fond
justifyContent: 'center',
alignItems: 'center',
elevation: 4, // ombre sur Android
},
title: {
color: '#fff',
fontSize: 18,
fontWeight: 'bold',
},
});

