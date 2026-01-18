import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { RootTabParamList } from '../navigation/MainNavigator'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

export default function HomeScreen() {
    const theme = useTheme()
    const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>()
    console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>🌿 BioScan</Text>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Identify')} // tab navigator name
            >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                    Start Identifying
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Discoveries')} // tab navigator name
            >
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                    View Discoveries
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 40 },
    button: { padding: 16, borderRadius: 10, marginVertical: 10, minWidth: 200, alignItems: 'center' },
    buttonText: { fontSize: 18, fontWeight: '600' },
});
