// src/screens/DiscoveriesScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Image,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
} from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";
import { useNavigation, NavigationProp } from '@react-navigation/native';
import MapView, { Marker } from "react-native-maps";
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import { getDiscoveries, deleteDiscovery } from "../utils/storage";
import { Discovery } from "../types/discovery";
import { semanticColors } from "../styles/theme";

export type RootStackParamList = {
    Home: undefined;
    Capture: undefined;
    Discoveries: { newDiscovery?: Discovery } | undefined;
    Detail: { discovery: Discovery };
};

export default function DiscoveriesScreen() {
    const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    useEffect(() => {
        const loadDiscoveries = async () => {
            const savedPlants = (await getDiscoveries()).filter(d => !!d.photoUri);
            setDiscoveries(savedPlants);
        };
        loadDiscoveries();
    }, []);

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete discovery",
            "Are you sure you want to delete this discovery?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteDiscovery(id);
                        setDiscoveries(prev => prev.filter(d => d.id !== id));
                    },
                },
            ]
        );
    };

    const renderList = () => (
        <SwipeListView
            data={discoveries}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={{ marginBottom: 12 }}
                    onPress={() => navigation.navigate('Detail', { discovery: item })}
                    activeOpacity={1}
                >
                    <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                        <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.resultTitle, { color: theme.colors.onSurface }]}>
                                {item.speciesName}
                            </Text>
                            <Text style={[styles.resultText, { color: theme.colors.onSurface }]}>
                                Confidence: {item?.confidence ? (item.confidence * 100).toFixed(1) : 0}%
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
            renderHiddenItem={({ item }) => (
                <View style={[styles.hiddenItem, { backgroundColor: theme.colors.background }]}>
                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: semanticColors.danger }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
            rightOpenValue={-100}
            disableRightSwipe
        />
    );

    const renderMap = () => (
        <MapView
            followsUserLocation
            mapType='satellite'
            region={{
                latitude: discoveries[0]?.location?.latitude || 50.0158,
                longitude: discoveries[0]?.location?.longitude || 15.7402,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            }}
            showsUserLocation
            style={styles.map}
            {...discoveries[0]}
        >
            {discoveries.map(d => d.location && (
                <Marker
                    key={d.id}
                    coordinate={{ latitude: d.location.latitude, longitude: d.location.longitude }}
                    title={d.speciesName}
                />
            ))}
        </MapView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Text style={[styles.toggleText, viewMode == 'list' && styles.toggleTextActive]}>List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
                        onPress={() => setViewMode('map')}
                    >
                        <Text style={[styles.toggleText, viewMode == 'map' && styles.toggleTextActive]}>Map</Text>
                    </TouchableOpacity>
                </View>

                {viewMode === 'list' ? renderList() : renderMap()}
            </SafeAreaView>
            {/* View Toggle */}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    toggleButtonActive: {
        backgroundColor: '#28a745',
        borderColor: '#28a745',
        color: '#fff',
    },
    toggleText: {
        fontWeight: '600',
        color: '#000',
    },
    toggleTextActive: {
        color: '#fff',
    },
    resultCard: {
        padding: 6,
        borderRadius: 12,
        flex: 1,
        flexDirection: 'row',
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    resultText: {
        fontSize: 14,
    },
    hiddenItem: {
        alignItems: "flex-end",
        flex: 1,
        justifyContent: "center",
        paddingRight: 16,
        marginBottom: 18,
        borderRadius: 12,
    },
    deleteButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    thumbnail: {
        width: 80,
        height: 80,
        resizeMode: "cover",
    },
    map: {
        marginLeft: -8,
        marginTop: 5,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 200,
    },
});
